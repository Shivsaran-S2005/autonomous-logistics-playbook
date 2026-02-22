import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSimulationContext } from "@/contexts/SimulationContext";
import {
  getRetailerDeliveryViews,
  getDeliveriesPerRegion,
  getStockLevelsReport,
  getSupplierPerformanceReport,
  getSuppliers,
  getProducts,
  addRetailerRequest,
  getRetailerRequests,
  subscribeToUpdates,
  getProductById,
} from "@/data/db";
import type { RetailerDeliveryView } from "@/data/types";
import { LiveDeliveryFeed } from "@/components/supply-chain/LiveDeliveryFeed";
import { RetailerChatbot } from "@/components/supply-chain/RetailerChatbot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Download, MessageSquare, Send, Building2, Activity, CheckCircle, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { enableFromUserGesture, isVoiceEnabled, speakRetailerResolved } from "@/lib/voiceAlerts";

const SUPPLIER_DETAIL_CADBURY = {
  sup_cadbury: {
    keyProducts: "5 Star, Dairy Milk, Perk, Gems, Bournville, Dairy Milk Silk",
    notes: "Primary chocolate & confectionery supplier. DCs: Mumbai, Delhi, Bangalore, Chennai, Kolkata.",
  },
};

export default function RetailerDashboardPage() {
  const { role, retailer, logout } = useAuth();
  const navigate = useNavigate();
  const { world } = useSimulationContext();
  const [deliveries, setDeliveries] = useState<RetailerDeliveryView[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [requestType, setRequestType] = useState("");
  const [requestSupplier, setRequestSupplier] = useState("");
  const [requestProduct, setRequestProduct] = useState("");
  const [requestCategory, setRequestCategory] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requests, setRequests] = useState<ReturnType<typeof getRetailerRequests>>([]);
  const announcedResolvedRef = useRef<Set<string>>(new Set());
  const RESOLVED_RECENT_MS = 120_000;

  // Voice: when a request becomes Resolved (supplier resolved it), announce to retailer
  useEffect(() => {
    if (!retailer || !isVoiceEnabled()) return;
    for (const req of requests) {
      if (req.status !== "Resolved" || announcedResolvedRef.current.has(req.requestId)) continue;
      announcedResolvedRef.current.add(req.requestId);
      const resolvedAgo = req.resolvedAt ? Date.now() - new Date(req.resolvedAt).getTime() : Infinity;
      if (resolvedAgo > RESOLVED_RECENT_MS) continue;
      const productName = req.productName ?? (req.productId ? getProductById(req.productId)?.name : null) ?? "—";
      speakRetailerResolved(productName ?? "—", req.message || "—");
    }
  }, [requests, retailer]);

  useEffect(() => {
    if (role !== "retailer" || !retailer) {
      navigate("/login");
      return;
    }
    const refresh = () => {
      let list = getRetailerDeliveryViews(retailer.retailerId);
      if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (d) =>
            d.productName.toLowerCase().includes(q) ||
            d.shipmentId.toLowerCase().includes(q) ||
            d.supplierName.toLowerCase().includes(q)
        );
      }
      if (deliveryDateFilter) {
        list = list.filter((d) => d.eta.startsWith(deliveryDateFilter));
      }
      setDeliveries(list);
    };
    refresh();
    setRequests(retailer ? getRetailerRequests(retailer.retailerId) : []);
    const syncRequests = () => {
      if (retailer) setRequests(getRetailerRequests(retailer.retailerId));
    };
    const unsub = subscribeToUpdates(() => {
      refresh();
      syncRequests();
    });
    const poll = setInterval(syncRequests, 2000);
    return () => {
      unsub();
      clearInterval(poll);
    };
  }, [role, retailer, navigate, search, statusFilter, deliveryDateFilter]);

  const handleRaiseRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retailer || !requestMessage.trim()) return;
    const typeTrimmed = requestType.trim() || "General request";
    const productListForResolve = getProducts();
    const selectedProduct = requestProduct
      ? productListForResolve.find((p) => p.productId === requestProduct)
      : null;
    addRetailerRequest({
      retailerId: retailer.retailerId,
      type: typeTrimmed,
      supplierId: requestSupplier || undefined,
      productId: requestProduct || undefined,
      productName: selectedProduct?.name,
      category: requestCategory.trim() || selectedProduct?.category,
      quantity: requestQuantity ? Number(requestQuantity) : undefined,
      message: requestMessage.trim(),
    });
    setRequestType("");
    setRequestMessage("");
    setRequestSupplier("");
    setRequestProduct("");
    setRequestCategory("");
    setRequestQuantity("");
    setRequests(getRetailerRequests(retailer.retailerId));
    toast.success("Request submitted. Redirecting to Live Event Feed.");
    navigate("/consumer/requests");
  };

  const delayedDeliveries = deliveries.filter((d) => d.status === "delayed");
  const regionReport = getDeliveriesPerRegion();
  const stockReport = getStockLevelsReport();
  const supplierReport = getSupplierPerformanceReport();
  const supplierList = getSuppliers();
  const productList = getProducts();
  const simSuppliers = world.suppliers;
  const categoryOptions = retailer
    ? [
        ...new Set(
          productList
            .filter((p) => retailer.authorizedSupplierIds.includes(p.supplierId))
            .map((p) => p.category)
        ),
      ].sort()
    : [];

  const exportCsv = (data: unknown[], filename: string) => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0] as object);
    const header = keys.join(",");
    const rows = data.map((row) => keys.map((k) => JSON.stringify((row as Record<string, unknown>)[k] ?? "")).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (role !== "retailer" || !retailer) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl tracking-widest text-neon-cyan text-glow-cyan">
            RETAILER DASHBOARD — {retailer.name}
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Region: {retailer.region} · Viewing transit & raising requests · Data connected to supplier operations
          </p>
        </div>
        <Button variant="outline" size="sm" className="font-mono" onClick={() => { logout(); navigate("/login"); }}>
          Sign out
        </Button>
      </div>

      {delayedDeliveries.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="font-mono text-sm font-medium text-destructive">
                {delayedDeliveries.length} delayed shipment(s)
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {delayedDeliveries.map((d) => d.productName + " (" + d.shipmentId + ")").join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Live supplier status — connected to supplier-side simulation */}
          <Card className="border-neon-cyan/30">
            <CardHeader className="py-2 flex flex-row items-center gap-2">
              <Activity className="w-4 h-4 text-neon-cyan" />
              <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
                LIVE SUPPLIER STATUS (FROM OPERATIONS)
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-[10px] text-muted-foreground font-mono mb-2">
                Same suppliers as on the supplier-side map. Status updates with operations.
              </p>
              <div className="flex flex-wrap gap-2">
                {simSuppliers.map((s) => (
                  <Badge
                    key={s.id}
                    variant={s.active ? "default" : "destructive"}
                    className="font-mono text-[10px]"
                  >
                    {s.name}: {s.active ? "Active" : "Inactive"} ({(s.reliability * 100).toFixed(0)}%)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <LiveDeliveryFeed />

          <Card className="border-neon-cyan/30">
            <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
                TRACKING — SEARCH & FILTER
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-[10px]"
                  onClick={() => exportCsv(deliveries, `deliveries-${retailer.retailerId}-${new Date().toISOString().slice(0, 10)}.csv`)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export deliveries
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Product, shipment ID, supplier..."
                  className="font-mono max-w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  className="font-mono w-[140px]"
                  value={deliveryDateFilter}
                  onChange={(e) => setDeliveryDateFilter(e.target.value)}
                />
              </div>
              <ul className="space-y-2 max-h-[280px] overflow-y-auto">
                {deliveries.map((d) => (
                  <li key={d.deliveryId} className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-2 font-mono text-xs">
                    <span className="font-medium">{d.productName}</span>
                    <Badge variant={d.status === "delayed" ? "destructive" : "secondary"}>{d.status}</Badge>
                    <span className="text-muted-foreground">{d.shipmentId}</span>
                    <span>{d.currentLocation}</span>
                    <span>ETA: {new Date(d.eta).toLocaleString()}</span>
                  </li>
                ))}
                {deliveries.length === 0 && (
                  <li className="text-muted-foreground">No deliveries match filters.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Supplier details — Cadbury and others */}
          <Card className="border-border">
            <CardHeader className="py-2 flex flex-row items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-xs font-mono">SUPPLIER DETAILS</CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-3 max-h-48 overflow-y-auto">
              {supplierList.filter((s) => retailer.authorizedSupplierIds.includes(s.supplierId)).map((s) => {
                const detail = SUPPLIER_DETAIL_CADBURY[s.supplierId as keyof typeof SUPPLIER_DETAIL_CADBURY];
                return (
                  <div key={s.supplierId} className="border-b border-border/50 pb-2 font-mono text-[11px]">
                    <div className="font-medium text-primary">{s.name}</div>
                    <div className="text-muted-foreground">{s.contactInfo}</div>
                    <div>Regions: {s.distributionRegions.join(", ")}</div>
                    {detail && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Key products: {detail.keyProducts}. {detail.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Raise request */}
          <Card className="border-border">
            <CardHeader className="py-2">
              <CardTitle className="text-xs font-mono flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                RAISE REQUEST
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <form onSubmit={handleRaiseRequest} className="space-y-2">
                <div>
                  <Label className="text-[10px]">Type (any request type)</Label>
                  <Input
                    className="font-mono text-xs h-8"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    placeholder="e.g. restock, delay report, general, custom..."
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Supplier</Label>
                  <Select value={requestSupplier} onValueChange={setRequestSupplier}>
                    <SelectTrigger className="h-8 font-mono text-xs">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierList.filter((s) => retailer.authorizedSupplierIds.includes(s.supplierId)).map((s) => (
                        <SelectItem key={s.supplierId} value={s.supplierId}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px]">Product Name</Label>
                  <Select
                    value={requestProduct}
                    onValueChange={(val) => {
                      setRequestProduct(val);
                      const p = productList.find((x) => x.productId === val);
                      if (p) setRequestCategory(p.category);
                    }}
                  >
                    <SelectTrigger className="h-8 font-mono text-xs">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productList.filter((p) => retailer.authorizedSupplierIds.includes(p.supplierId)).map((p) => (
                        <SelectItem key={p.productId} value={p.productId}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px]">Category</Label>
                  <Select value={requestCategory} onValueChange={setRequestCategory}>
                    <SelectTrigger className="h-8 font-mono text-xs">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px]">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    className="font-mono text-xs h-8"
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Message (required)</Label>
                  <Input
                    className="font-mono text-xs h-8"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Describe your request..."
                    required
                  />
                </div>
                <Button type="submit" size="sm" className="w-full font-mono text-xs">
                  Submit request
                </Button>
              </form>
              {requests.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Your requests: {requests.filter((r) => r.status === "Pending").length} pending
                </p>
              )}
            </CardContent>
          </Card>

          {/* Your requests & resolutions — updates in real time when supplier resolves */}
          {requests.length > 0 && (
            <Card className="border-border">
              <CardHeader className="py-2 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xs font-mono">YOUR REQUESTS & RESOLUTIONS</CardTitle>
                  <p className="text-[10px] text-muted-foreground font-mono">Updates in real time when supplier resolves. Voice: hear when your issue is resolved.</p>
                </div>
                {!isVoiceEnabled() && (
                  <Button variant="outline" size="sm" className="font-mono text-[10px] shrink-0" onClick={() => enableFromUserGesture("Voice enabled. You will hear when your issues are resolved.")}>
                    <Volume2 className="w-3 h-3 mr-1" /> Enable voice
                  </Button>
                )}
                {isVoiceEnabled() && <span className="font-mono text-[10px] text-muted-foreground shrink-0 flex items-center gap-1"><Volume2 className="w-3 h-3" /> Voice on</span>}
              </CardHeader>
              <CardContent className="py-2 space-y-2 max-h-40 overflow-y-auto">
                {requests.slice(0, 8).map((r) => (
                  <div
                    key={r.requestId}
                    className={`font-mono text-[10px] border-b border-border/50 pb-1.5 ${r.status === "Resolved" ? "border-l-2 border-l-emerald-500 pl-2" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {r.status === "Resolved" && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      <Badge variant={r.status === "Pending" ? "destructive" : "secondary"}>
                        {r.status === "Resolved" ? "Issue Resolved" : r.status}
                      </Badge>
                      <span>{r.type}</span>
                    </div>
                    <div className="text-muted-foreground truncate">{r.message}</div>
                    {r.resolutionNote && (
                      <div className="text-neon-cyan/90 mt-0.5">→ {r.resolvedBy === "ai" ? "AI" : "Manual"}: {r.resolutionNote.slice(0, 80)}{r.resolutionNote.length > 80 ? "…" : ""}</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="font-mono text-xs text-neon-cyan mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              CHATBOT — LIVE CONNECTION TO SUPPLIER
            </h3>
            <RetailerChatbot retailer={retailer} />
          </div>

          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full grid-cols-2 font-mono text-[10px]">
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            <TabsContent value="reports" className="mt-2">
              <Card className="border-border">
                <CardHeader className="py-2">
                  <CardTitle className="text-xs font-mono">By region</CardTitle>
                </CardHeader>
                <CardContent className="py-2 text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                  {regionReport.map((r) => (
                    <div key={r.region} className="flex justify-between">
                      <span>{r.region}</span>
                      <span>Total: {r.totalDeliveries} (✓{r.delivered} in transit:{r.inTransit} delayed:{r.delayed})</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border mt-2">
                <CardHeader className="py-2">
                  <CardTitle className="text-xs font-mono">Supplier performance</CardTitle>
                </CardHeader>
                <CardContent className="py-2 text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                  {supplierReport.filter((s) => retailer.authorizedSupplierIds.includes(s.supplierId)).map((s) => (
                    <div key={s.supplierId} className="flex justify-between">
                      <span>{s.supplierName}</span>
                      <span>Deliveries: {s.totalDeliveries} · On-time: {s.onTimeRate.toFixed(0)}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="export" className="mt-2 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full font-mono text-xs"
                onClick={() => exportCsv(deliveries, `deliveries-${retailer.retailerId}.csv`)}
              >
                <Download className="w-3 h-3 mr-1" /> Deliveries CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full font-mono text-xs"
                onClick={() => exportCsv(stockReport, "stock-levels.csv")}
              >
                <Download className="w-3 h-3 mr-1" /> Stock levels CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full font-mono text-xs"
                onClick={() => exportCsv(supplierReport, "supplier-performance.csv")}
              >
                <Download className="w-3 h-3 mr-1" /> Supplier performance CSV
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
