import { useState, useMemo } from "react";
import { useSimulationContext } from "@/contexts/SimulationContext";
import { MapGrid } from "@/components/ares/MapGrid";
import { InventoryPanel } from "@/components/ares/InventoryPanel";
import {
  addCadburyProduct,
  getCadburyProducts,
  updateCadburyInventory,
  getCadburyDistributionReportByLocation,
  getCadburyDistributionReportByProductType,
} from "@/cadbury/database";
import type { CadburyProductType } from "@/cadbury/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, BarChart3, MapPin, Plus, RefreshCw } from "lucide-react";

const PRODUCT_TYPES: CadburyProductType[] = [
  "Chocolate Bar",
  "Wafer",
  "Countline",
  "Dark Chocolate",
  "Gems/Confectionery",
];

export default function CadburyProductsPage() {
  const { world } = useSimulationContext();
  const [products, setProducts] = useState(() => getCadburyProducts());
  const [addForm, setAddForm] = useState({
    productName: "",
    type: "Chocolate Bar" as CadburyProductType,
    quantity: 0,
    distributionLocation: "",
    price: 0,
    expiryDate: "",
  });
  const [stockUpdate, setStockUpdate] = useState<{ id: string; delta: number }>({ id: "", delta: 0 });

  const refresh = () => setProducts(getCadburyProducts());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.productName.trim() || !addForm.distributionLocation.trim() || !addForm.expiryDate)
      return;
    addCadburyProduct({
      productName: addForm.productName.trim(),
      type: addForm.type,
      quantity: Math.max(0, addForm.quantity),
      distributionLocation: addForm.distributionLocation.trim(),
      price: Math.max(0, addForm.price),
      expiryDate: addForm.expiryDate,
    });
    setAddForm({
      productName: "",
      type: "Chocolate Bar",
      quantity: 0,
      distributionLocation: "",
      price: 0,
      expiryDate: "",
    });
    refresh();
  };

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockUpdate.id || stockUpdate.delta === 0) return;
    updateCadburyInventory(stockUpdate.id, stockUpdate.delta);
    setStockUpdate({ id: "", delta: 0 });
    refresh();
  };

  const byLocation = useMemo(() => getCadburyDistributionReportByLocation(), [products]);
  const byType = useMemo(() => getCadburyDistributionReportByProductType(), [products]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg tracking-widest text-neon-cyan text-glow-cyan">
          // CADBURY CHOCOLATES — PRODUCTS & DISTRIBUTION
        </h1>
        <span className="font-mono text-[10px] text-muted-foreground">
          Supplier: Cadbury only • All tables and reports scoped to Cadbury
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-h-[320px]">
          <MapGrid world={world} />
        </div>
        <div>
          <InventoryPanel world={world} />
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4 font-mono text-[11px]">
          <TabsTrigger value="products" className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Products & Stock
          </TabsTrigger>
          <TabsTrigger value="add">Add Product</TabsTrigger>
          <TabsTrigger value="reports-location" className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            By Location
          </TabsTrigger>
          <TabsTrigger value="reports-type" className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            By Type
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card className="cyber-panel border-neon-cyan/30">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-xs tracking-widest text-neon-cyan flex items-center justify-between">
                <span>CADBURY PRODUCTS — STOCK & DISTRIBUTION STATUS</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary h-7"
                  onClick={refresh}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[11px]">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-2">Product</th>
                      <th className="py-2 pr-2">Type</th>
                      <th className="py-2 pr-2">Qty</th>
                      <th className="py-2 pr-2">Location</th>
                      <th className="py-2 pr-2">Price</th>
                      <th className="py-2 pr-2">Expiry</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 text-primary">{p.productName}</td>
                        <td className="py-1.5 pr-2">{p.type}</td>
                        <td className="py-1.5 pr-2">{p.quantity}</td>
                        <td className="py-1.5 pr-2">{p.distributionLocation}</td>
                        <td className="py-1.5 pr-2">₹{p.price}</td>
                        <td className="py-1.5 pr-2">{p.expiryDate}</td>
                        <td className="py-1.5">
                          <span
                            className={
                              p.stockStatus === "out_of_stock"
                                ? "text-neon-red"
                                : p.stockStatus === "low_stock"
                                  ? "text-neon-orange"
                                  : "text-neon-green"
                            }
                          >
                            {p.stockStatus.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form onSubmit={handleStockUpdate} className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3 items-end">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Product</Label>
                  <Select
                    value={stockUpdate.id}
                    onValueChange={(v) => setStockUpdate((s) => ({ ...s, id: v }))}
                  >
                    <SelectTrigger className="h-8 font-mono text-xs w-[160px]">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.productName} ({p.distributionLocation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Qty change (+/−)</Label>
                  <Input
                    type="number"
                    className="h-8 font-mono w-24"
                    value={stockUpdate.delta || ""}
                    onChange={(e) =>
                      setStockUpdate((s) => ({ ...s, delta: parseInt(e.target.value, 10) || 0 }))
                    }
                    placeholder="e.g. 50 or -20"
                  />
                </div>
                <Button type="submit" size="sm" className="h-8 font-mono">
                  Update inventory
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <Card className="cyber-panel border-neon-cyan/30 max-w-md">
            <CardHeader>
              <CardTitle className="font-display text-xs tracking-widest text-neon-cyan flex items-center gap-2">
                <Plus className="w-4 h-4" />
                ADD NEW CADBURY PRODUCT
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-mono">
                New product is automatically linked to supplier: Cadbury
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <Label className="text-[10px]">Product name</Label>
                  <Input
                    className="font-mono mt-0.5"
                    value={addForm.productName}
                    onChange={(e) => setAddForm((f) => ({ ...f, productName: e.target.value }))}
                    placeholder="e.g. Dairy Milk Silk"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Type</Label>
                  <Select
                    value={addForm.type}
                    onValueChange={(v) => setAddForm((f) => ({ ...f, type: v as CadburyProductType }))}
                  >
                    <SelectTrigger className="font-mono mt-0.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Quantity</Label>
                    <Input
                      type="number"
                      min={0}
                      className="font-mono mt-0.5"
                      value={addForm.quantity || ""}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, quantity: parseInt(e.target.value, 10) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Price (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      className="font-mono mt-0.5"
                      value={addForm.price || ""}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px]">Distribution location</Label>
                  <Input
                    className="font-mono mt-0.5"
                    value={addForm.distributionLocation}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, distributionLocation: e.target.value }))
                    }
                    placeholder="e.g. Mumbai DC"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Expiry date</Label>
                  <Input
                    type="date"
                    className="font-mono mt-0.5"
                    value={addForm.expiryDate}
                    onChange={(e) => setAddForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-mono">
                  Add Cadbury product
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports-location" className="mt-4">
          <Card className="cyber-panel border-neon-cyan/30">
            <CardHeader>
              <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
                DISTRIBUTION PERFORMANCE BY LOCATION (CADBURY ONLY)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[11px]">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-2">Location</th>
                      <th className="py-2 pr-2">Total quantity</th>
                      <th className="py-2 pr-2">Product count</th>
                      <th className="py-2 pr-2">Total value (₹)</th>
                      <th className="py-2 pr-2">Low stock</th>
                      <th className="py-2">Out of stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byLocation.map((r) => (
                      <tr key={r.location} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 text-primary">{r.location}</td>
                        <td className="py-1.5 pr-2">{r.totalQuantity}</td>
                        <td className="py-1.5 pr-2">{r.productCount}</td>
                        <td className="py-1.5 pr-2">{r.totalValue.toLocaleString()}</td>
                        <td className="py-1.5 pr-2 text-neon-orange">{r.lowStockCount}</td>
                        <td className="py-1.5 text-neon-red">{r.outOfStockCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports-type" className="mt-4">
          <Card className="cyber-panel border-neon-cyan/30">
            <CardHeader>
              <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
                DISTRIBUTION PERFORMANCE BY PRODUCT TYPE (CADBURY ONLY)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[11px]">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-2">Product type</th>
                      <th className="py-2 pr-2">Total quantity</th>
                      <th className="py-2 pr-2">Product count</th>
                      <th className="py-2 pr-2">Total value (₹)</th>
                      <th className="py-2">Locations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byType.map((r) => (
                      <tr key={r.productType} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 text-primary">{r.productType}</td>
                        <td className="py-1.5 pr-2">{r.totalQuantity}</td>
                        <td className="py-1.5 pr-2">{r.productCount}</td>
                        <td className="py-1.5 pr-2">{r.totalValue.toLocaleString()}</td>
                        <td className="py-1.5">{r.locations.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
