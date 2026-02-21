import { useState, useEffect, useRef, useCallback } from "react";
import { useSimulationContext } from "@/contexts/SimulationContext";
import {
  getAllRequests,
  resolveRequest,
  getProductById,
  getRequestById,
  getSupplierById,
  subscribeToUpdates,
} from "@/data/db";
import type { RetailerRequest } from "@/data/types";
import {
  enableFromUserGesture,
  isVoiceEnabled,
  speakNewRequestWithDetails,
  speakResolvedForProductAndMessage,
} from "@/lib/voiceAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertCircle, Bot, RefreshCw, CheckCircle, Volume2, ChevronDown, Package, Truck, Wrench } from "lucide-react";
import { toast } from "sonner";

const LIVE_FEED_REFRESH_MS = 30000; // 30–60s: full refresh
const REALTIME_POLL_MS = 2000; // 2s fallback for immediate cross-tab sync

export default function SupplierRequestsPage() {
  const { world, dispatchTransfer, start } = useSimulationContext();
  const [requests, setRequests] = useState<RetailerRequest[]>([]);
  const [manualRequestId, setManualRequestId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [newRequestIds, setNewRequestIds] = useState<Set<string>>(new Set());
  const seenRequestIdsRef = useRef<Set<string>>(new Set());
  const announcedResolvedRef = useRef<Set<string>>(new Set());
  const refresh = useCallback(() => setRequests(getAllRequests()), []);

  // Enable voice on any user interaction so queued alerts can play
  useEffect(() => {
    const onInteract = () => enableFromUserGesture();
    window.addEventListener("click", onInteract);
    window.addEventListener("keydown", onInteract);
    return () => {
      window.removeEventListener("click", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeToUpdates(refresh);
    const fastPoll = setInterval(refresh, REALTIME_POLL_MS);
    const slowPoll = setInterval(refresh, LIVE_FEED_REFRESH_MS);
    return () => {
      unsub();
      clearInterval(fastPoll);
      clearInterval(slowPoll);
    };
  }, [refresh]);

  // Voice: new request — triggers automatically for every new Pending request (queued; no overlap)
  useEffect(() => {
    const seen = seenRequestIdsRef.current;
    for (const req of requests) {
      if (req.status !== "Pending" || seen.has(req.requestId)) continue;
      seen.add(req.requestId);
      const product = req.productId ? getProductById(req.productId) : null;
      const productName = req.productName ?? product?.name ?? req.productId ?? "—";
      const category = req.category ?? product?.category ?? "—";
      const type = req.type || "—";
      const quantity = req.quantity ?? "—";
      const message = req.message || "—";
      setNewRequestIds((prev) => new Set(prev).add(req.requestId));
      speakNewRequestWithDetails(productName, category, type, quantity, message);
    }
  }, [requests]);

  // Clear highlight after 8 seconds
  useEffect(() => {
    if (newRequestIds.size === 0) return;
    const t = setTimeout(() => setNewRequestIds(new Set()), 8000);
    return () => clearTimeout(t);
  }, [newRequestIds]);

  // Voice: resolved request — triggers automatically when a request becomes Resolved (self or external)
  // Only speak for resolutions within last 2 min (avoid announcing old resolved on page load)
  // Avoids double-speak: we add to announced before resolve when we click; effect skips those
  const RESOLVED_RECENT_MS = 120_000;
  useEffect(() => {
    const announced = announcedResolvedRef.current;
    for (const req of requests) {
      if (req.status !== "Resolved" || announced.has(req.requestId)) continue;
      announced.add(req.requestId);
      const resolvedAgo = req.resolvedAt ? Date.now() - new Date(req.resolvedAt).getTime() : Infinity;
      if (resolvedAgo > RESOLVED_RECENT_MS) continue;
      const product = req.productId ? getProductById(req.productId) : null;
      const productName = req.productName ?? product?.name ?? req.productId ?? "—";
      const message = req.message || "—";
      speakResolvedForProductAndMessage(productName, message, false);
    }
  }, [requests]);

  const tryAiResolve = (req: RetailerRequest) => {
    if (req.status !== "Pending") return;
    const typeLower = req.type.toLowerCase();
    const isRestock = typeLower.includes("restock");
    const isDelay = typeLower.includes("delay");
    const isGeneral = typeLower.includes("general") || typeLower === "general request";
    const fromWh = world.warehouses.find((w) => w.inventory >= 15);
    const toWh = world.warehouses.find((w) => w.id !== fromWh?.id && w.inventory < w.maxInventory * 0.5);
    if (isRestock && fromWh && toWh) {
      const qty = Math.min(15, fromWh.inventory, toWh.maxInventory - toWh.inventory);
      if (qty > 0) {
        dispatchTransfer(fromWh.id, toWh.id, qty, req.requestId);
        announcedResolvedRef.current.add(req.requestId);
        resolveRequest(
          req.requestId,
          `AI: Transfer of ${qty} units initiated from ${fromWh.name} → ${toWh.name}. Watch the map for live truck movement.`,
          "ai"
        );
        if (!world.running) start();
        setNewRequestIds((p) => { const n = new Set(p); n.delete(req.requestId); return n; });
        toast.success("Issue Resolved");
        const product = req.productId ? getProductById(req.productId) : null;
        enableFromUserGesture();
        speakResolvedForProductAndMessage(
          req.productName ?? product?.name ?? req.productId ?? "request",
          req.message || "—",
          true
        );
        refresh();
        return;
      }
    }
    if (isDelay) {
      announcedResolvedRef.current.add(req.requestId);
      resolveRequest(
        req.requestId,
        "AI: Delay noted. Delivery team notified; ETA will be updated.",
        "ai"
      );
      setNewRequestIds((p) => { const n = new Set(p); n.delete(req.requestId); return n; });
      toast.success("Issue Resolved");
      const product = req.productId ? getProductById(req.productId) : null;
      enableFromUserGesture();
      speakResolvedForProductAndMessage(
        req.productName ?? product?.name ?? req.productId ?? "request",
        req.message || "—",
        true
      );
      refresh();
      return;
    }
    if (isGeneral) {
      announcedResolvedRef.current.add(req.requestId);
      resolveRequest(
        req.requestId,
        "AI: Request received. A team member will follow up if needed.",
        "ai"
      );
      setNewRequestIds((p) => { const n = new Set(p); n.delete(req.requestId); return n; });
      toast.success("Issue Resolved");
      const product = req.productId ? getProductById(req.productId) : null;
      enableFromUserGesture();
      speakResolvedForProductAndMessage(
        req.productName ?? product?.name ?? req.productId ?? "request",
        req.message || "—",
        true
      );
      refresh();
      return;
    }
    toast.error("AI could not resolve this request automatically. Use Manual Resolve and state exactly what the issue is.");
  };

  const openResolveIssue = (requestId: string) => {
    setManualRequestId(requestId);
    setResolutionNote("");
  };

  const submitManualFix = () => {
    if (!manualRequestId || !resolutionNote.trim()) return;
    const req = getRequestById(manualRequestId);
    if (!req) return;
    announcedResolvedRef.current.add(manualRequestId);
    const product = req.productId ? getProductById(req.productId) : null;
    resolveRequest(
      manualRequestId,
      `Manual: ${resolutionNote.trim()}`,
      "manual"
    );
    setNewRequestIds((prev) => {
      const next = new Set(prev);
      next.delete(manualRequestId);
      return next;
    });
    toast.success("Issue Resolved");
    enableFromUserGesture();
    speakResolvedForProductAndMessage(
      req.productName ?? product?.name ?? req.productId ?? "request",
      req.message || "—",
      true
    );
    setManualRequestId(null);
    setResolutionNote("");
    refresh();
  };

  const handleDropdownAction = (
    req: RetailerRequest,
    action: "restock" | "delay" | "ai" | "manual"
  ) => {
    if (req.status !== "Pending") return;
    if (action === "manual") {
      openResolveIssue(req.requestId);
      return;
    }
    enableFromUserGesture();
    const productName = req.productName ?? getProductById(req.productId ?? "")?.name ?? req.productId ?? "—";
    const message = req.message || "—";
    if (action === "restock") {
      announcedResolvedRef.current.add(req.requestId);
      resolveRequest(req.requestId, "Restock supply initiated. Stock replenishment in progress.", "manual");
    } else if (action === "delay") {
      announcedResolvedRef.current.add(req.requestId);
      resolveRequest(req.requestId, "Delay acknowledged. ETA updated. Retailer notified.", "manual");
    } else {
      tryAiResolve(req);
      return;
    }
    setNewRequestIds((p) => { const n = new Set(p); n.delete(req.requestId); return n; });
    toast.success("Issue Resolved");
    speakResolvedForProductAndMessage(productName, message, true);
    refresh();
  };

  const openCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg tracking-widest text-neon-cyan text-glow-cyan">
          SUPPLIER OVERVIEW — LIVE EVENT FEED
        </h1>
        <div className="flex items-center gap-2">
          {!isVoiceEnabled() && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 font-mono flex items-center gap-1.5"
              onClick={() => enableFromUserGesture("Voice alerts enabled. You will hear new requests and resolve confirmations.")}
            >
              <Volume2 className="w-3.5 h-3.5" />
              Enable voice alerts
            </Button>
          )}
          {isVoiceEnabled() && (
            <Badge variant="secondary" className="font-mono text-[10px] flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Voice on
            </Badge>
          )}
          <Badge variant="outline" className="font-mono">
            {openCount} pending
          </Badge>
          <Button variant="ghost" size="sm" onClick={refresh} className="h-8">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Real-time sync (2s). Orange = Pending, Green = Resolved. Voice: new request + &quot;Issue resolved&quot; on every resolve.
      </p>

      <Card className="border-neon-cyan/30">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xs tracking-widest text-neon-cyan flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            LIVE EVENT FEED — ALL REQUESTS (real-time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {requests.length === 0 && (
              <li className="text-muted-foreground font-mono text-sm">No requests yet.</li>
            )}
            {requests.map((req) => {
              const product = req.productId ? getProductById(req.productId) : null;
              const supplier = req.supplierId ? getSupplierById(req.supplierId) : null;
              const isPending = req.status === "Pending";
              const isNew = newRequestIds.has(req.requestId);
              return (
                <li
                  key={req.requestId}
                  className={`rounded-lg p-4 font-mono text-xs space-y-2 border-2 transition-all ${
                    isPending
                      ? "bg-orange-500/10 border-orange-500/50"
                      : "bg-emerald-500/10 border-emerald-500/50"
                  } ${isNew ? "ring-2 ring-orange-400 ring-offset-2 animate-pulse" : ""}`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <div><span className="text-muted-foreground">Type:</span> {req.type}</div>
                    <div><span className="text-muted-foreground">Supplier:</span> {supplier?.name ?? req.supplierId ?? "—"}</div>
                    <div><span className="text-muted-foreground">Product Name:</span> {req.productName ?? product?.name ?? req.productId ?? "—"}</div>
                    <div><span className="text-muted-foreground">Category:</span> {req.category ?? product?.category ?? "—"}</div>
                    <div><span className="text-muted-foreground">Quantity:</span> {req.quantity ?? "—"}</div>
                    <div><span className="text-muted-foreground">Timestamp:</span> {new Date(req.createdAt).toLocaleString()}</div>
                    <div className="sm:col-span-2"><span className="text-muted-foreground">Message / Error:</span> {req.message}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge
                      variant={isPending ? "outline" : "secondary"}
                      className={isPending ? "border-orange-500 text-orange-600" : "bg-emerald-600 text-white"}
                    >
                      {req.status}
                    </Badge>
                    <Badge variant="outline">{req.type}</Badge>
                    {req.quantity != null && (
                      <Badge variant="outline">Qty: {req.quantity}</Badge>
                    )}
                  </div>
                  {req.resolutionNote && (
                    <>
                      <div className="bg-emerald-500/15 border border-emerald-500/40 rounded p-2.5 pt-1.5 mt-2">
                        <div className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          Issue Resolved ✅ — Product: {req.productName ?? product?.name ?? req.productId ?? "—"}, Category: {req.category ?? product?.category ?? "—"}, Type: {req.type}, Quantity: {req.quantity ?? "—"}, Message: {req.message}
                        </div>
                        <div className="text-muted-foreground text-[10px] mt-1.5">
                          Resolved by {req.resolvedBy === "ai" ? "AI" : "Manual"}
                          {req.resolvedAt && ` · ${new Date(req.resolvedAt).toLocaleString()}`}
                        </div>
                        <div className="bg-muted/50 rounded p-1.5 mt-1 text-[10px] text-muted-foreground">
                          {req.resolutionNote}
                        </div>
                      </div>
                    </>
                  )}
                  {req.status === "Pending" && (
                    <div className="pt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-mono gap-1 bg-orange-600/20 border-orange-500 hover:bg-orange-600/30"
                          >
                            Actions <ChevronDown className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="font-mono">
                          <DropdownMenuItem onClick={() => handleDropdownAction(req, "restock")}>
                            <Package className="w-3.5 h-3.5 mr-2" />
                            Restock Supply
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDropdownAction(req, "delay")}>
                            <Truck className="w-3.5 h-3.5 mr-2" />
                            Delay Acknowledged
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDropdownAction(req, "ai")}>
                            <Bot className="w-3.5 h-3.5 mr-2" />
                            Use AI to Resolve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDropdownAction(req, "manual")}>
                            <Wrench className="w-3.5 h-3.5 mr-2" />
                            Manual Fix
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={!!manualRequestId} onOpenChange={(open) => !open && setManualRequestId(null)}>
        <DialogContent className="font-mono">
          <DialogHeader>
            <DialogTitle className="text-sm">Manual Fix — Add resolution note</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Describe how the issue was handled. Status will be set to Resolved and the retailer will be notified (with voice confirmation).
          </p>
          <div>
            <Label className="text-xs">Resolution note</Label>
            <Input
              className="mt-1 font-mono"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Stock replenished. Manual: Stock"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualRequestId(null)}>Cancel</Button>
            <Button onClick={submitManualFix} disabled={!resolutionNote.trim()}>
              Resolve & notify retailer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
