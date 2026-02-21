import {
  getLiveFeedEntries,
  updateFeedEntryStatus,
  addSupplyShift,
  getAlternateSupplierForProduct,
  getSupplierById,
  getProductById,
  subscribeToUpdates,
} from "@/data/db";
import type { LiveFeedEntry } from "@/data/types";
import { enableFromUserGesture, speakErrorResolved } from "@/lib/voiceAlerts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Package, Truck, Bot, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";

const ERROR_TYPE_LABELS: Record<LiveFeedEntry["errorType"], string> = {
  stock_shortage: "Stock shortage",
  transport_delay: "Transport delay",
  manual_error: "Manual error",
  ai_detected: "AI detected",
  other: "Other",
};

interface LiveFeedErrorsProps {
  onRefresh?: () => void;
}

export function LiveFeedErrors({ onRefresh }: LiveFeedErrorsProps) {
  const [entries, setEntries] = useState<LiveFeedEntry[]>([]);

  const refresh = useCallback(() => {
    setEntries(getLiveFeedEntries());
    onRefresh?.();
  }, [onRefresh]);

  useEffect(() => {
    refresh();
    const unsub = subscribeToUpdates(refresh);
    return () => unsub();
  }, [refresh]);

  const handleAction = (
    entry: LiveFeedEntry,
    action: "restock" | "delay_ack" | "ai_resolve" | "mark_resolved",
    resolutionNote: string
  ) => {
    if (entry.status === "Resolved") return;
    enableFromUserGesture();
    updateFeedEntryStatus(entry.feedId, "Resolved", resolutionNote);

    if (action === "restock" || action === "ai_resolve") {
      const alt = getAlternateSupplierForProduct(entry.supplierId, entry.productId);
      if (alt) {
        addSupplyShift({
          fromSupplierId: entry.supplierId,
          toSupplierId: alt.supplierId,
          productId: entry.productId,
          productName: entry.productName,
          quantity: entry.quantity ?? 0,
          feedId: entry.feedId,
        });
        const fromName = getSupplierById(entry.supplierId)?.name ?? entry.supplierId;
        toast.success(`Supply shifted: ${fromName} → ${alt.name}. Map updated.`);
      }
    }

    const productName = entry.productName ?? getProductById(entry.productId ?? "")?.name ?? "—";
    speakErrorResolved(
      `Product: ${productName}, Message: ${entry.message}. ${resolutionNote}`,
      true
    );
    toast.success("Issue Resolved");
    refresh();
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="font-mono text-xs font-medium text-neon-cyan">LIVE FEED — ERRORS & ACTIONS</h3>
      </div>
      <ul className="divide-y divide-border max-h-[420px] overflow-y-auto">
        {entries.length === 0 && (
          <li className="p-4 text-muted-foreground font-mono text-sm">No errors in feed.</li>
        )}
        {entries.map((entry) => {
          const supplier = getSupplierById(entry.supplierId);
          const isActive = entry.status === "Active";
          return (
            <li
              key={entry.feedId}
              className={`p-3 font-mono text-xs space-y-2 ${
                isActive ? "bg-red-500/5 border-l-2 border-red-500" : "bg-emerald-500/5 border-l-2 border-emerald-500"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isActive ? "destructive" : "secondary"}>
                  {ERROR_TYPE_LABELS[entry.errorType]}
                </Badge>
                <Badge variant="outline">{entry.status}</Badge>
                <span className="text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                <div><span className="text-muted-foreground">Supplier:</span> {supplier?.name ?? entry.supplierId}</div>
                <div><span className="text-muted-foreground">Product:</span> {entry.productName ?? entry.productId ?? "—"}</div>
                <div><span className="text-muted-foreground">Category:</span> {entry.category ?? "—"}</div>
                <div><span className="text-muted-foreground">Quantity affected:</span> {entry.quantity ?? "—"}</div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Message:</span> {entry.message}</div>
                {entry.aiSuggestion && (
                  <div className="sm:col-span-2 text-amber-600 dark:text-amber-400">
                    AI: {entry.aiSuggestion}
                  </div>
                )}
              </div>
              {entry.resolutionNote && (
                <div className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                  ✓ {entry.resolutionNote}
                </div>
              )}
              {isActive && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="font-mono gap-1">
                      Actions <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="font-mono">
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction(
                          entry,
                          "restock",
                          "Restock supply initiated; alternate supplier assigned."
                        )
                      }
                    >
                      <Package className="w-3.5 h-3.5 mr-2" />
                      Restock Supply
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction(
                          entry,
                          "delay_ack",
                          "Delay acknowledged. ETA updated."
                        )
                      }
                    >
                      <Truck className="w-3.5 h-3.5 mr-2" />
                      Delay Acknowledged
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction(
                          entry,
                          "ai_resolve",
                          "AI resolved. Supply rerouted to alternate supplier."
                        )
                      }
                    >
                      <Bot className="w-3.5 h-3.5 mr-2" />
                      Use AI to Resolve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction(
                          entry,
                          "mark_resolved",
                          "Marked resolved manually."
                        )
                      }
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      Mark Resolved
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
