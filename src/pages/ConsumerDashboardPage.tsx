import { useState, useEffect } from "react";
import { getProducts, getSuppliers, searchProducts, subscribeToUpdates } from "@/data/db";
import type { Product, ProductCategory } from "@/data/types";
import { LiveDeliveryFeed } from "@/components/supply-chain/LiveDeliveryFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES: ProductCategory[] = ["chocolate", "candy", "snack", "wafer", "biscuit", "confectionery"];

export default function ConsumerDashboardPage() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    const refresh = () => {
      let list = search ? searchProducts(search) : getProducts();
      if (supplierFilter !== "all") list = list.filter((p) => p.supplierId === supplierFilter);
      if (categoryFilter !== "all") list = list.filter((p) => p.type === categoryFilter);
      setProducts(list);
    };
    refresh();
    const unsub = subscribeToUpdates(refresh);
    return () => unsub();
  }, [search, supplierFilter, categoryFilter]);

  const suppliers = getSuppliers();

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="font-display text-xl tracking-widest text-neon-cyan text-glow-cyan">
          CONSUMER — PRODUCTS & DELIVERY STATUS
        </h1>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          Browse products and high-level shipment status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-neon-cyan/30">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-xs tracking-widest text-neon-cyan">
                PRODUCT CATALOG
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Search products..."
                  className="font-mono max-w-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-[180px] font-mono">
                    <SelectValue placeholder="Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All suppliers</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.supplierId} value={s.supplierId}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px] font-mono">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ul className="space-y-3 max-h-[400px] overflow-y-auto">
                {products.map((p) => (
                  <ProductCard key={p.productId} product={p} supplierName={suppliers.find((s) => s.supplierId === p.supplierId)?.name ?? ""} />
                ))}
                {products.length === 0 && (
                  <li className="text-muted-foreground font-mono text-sm">No products match filters.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div>
          <LiveDeliveryFeed />
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, supplierName }: { product: Product; supplierName: string }) {
  const inStock = product.quantityInStock > 0;
  return (
    <li className="border border-border rounded-md p-3 font-mono text-xs">
      <div className="flex justify-between items-start gap-2">
        <span className="font-medium text-primary">{product.name}</span>
        <Badge variant={inStock ? "default" : "secondary"}>{inStock ? "In stock" : "Out of stock"}</Badge>
      </div>
      <div className="text-muted-foreground mt-1">{supplierName} · {product.type}</div>
      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
      <div className="mt-2 flex justify-between">
        <span>₹{product.pricePerUnit}</span>
        <span>Status: {product.deliveryStatus}</span>
      </div>
    </li>
  );
}
