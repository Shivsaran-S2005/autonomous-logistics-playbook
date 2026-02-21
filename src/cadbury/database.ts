// Cadbury-only in-memory database and query API.
// All products are for supplier Cadbury only.

import {
  CADBURY_SUPPLIER_ID,
  CADBURY_SUPPLIER_NAME,
  type CadburyProduct,
  type CadburyProductType,
  type StockStatus,
  type DistributionPerformanceByLocation,
  type DistributionPerformanceByType,
} from "./types";

function uid() {
  return `cadbury_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function computeStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity < 20) return "low_stock";
  return "in_stock";
}

const DEFAULT_EXPIRY_DAYS = 365;

/** In-memory store: Cadbury products only */
let products: CadburyProduct[] = [
  {
    id: uid(),
    productName: "5 Star",
    type: "Chocolate Bar",
    quantity: 450,
    distributionLocation: "Mumbai DC",
    price: 30,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    stockStatus: "in_stock",
    supplierId: CADBURY_SUPPLIER_ID,
    supplierName: CADBURY_SUPPLIER_NAME,
    updatedAt: nowIso(),
  },
  {
    id: uid(),
    productName: "Dairy Milk",
    type: "Chocolate Bar",
    quantity: 620,
    distributionLocation: "Delhi DC",
    price: 50,
    expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    stockStatus: "in_stock",
    supplierId: CADBURY_SUPPLIER_ID,
    supplierName: CADBURY_SUPPLIER_NAME,
    updatedAt: nowIso(),
  },
  {
    id: uid(),
    productName: "Perk",
    type: "Wafer",
    quantity: 380,
    distributionLocation: "Bangalore DC",
    price: 20,
    expiryDate: new Date(Date.now() + 160 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    stockStatus: "in_stock",
    supplierId: CADBURY_SUPPLIER_ID,
    supplierName: CADBURY_SUPPLIER_NAME,
    updatedAt: nowIso(),
  },
  {
    id: uid(),
    productName: "Gems",
    type: "Gems/Confectionery",
    quantity: 15,
    distributionLocation: "Chennai DC",
    price: 10,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    stockStatus: "low_stock",
    supplierId: CADBURY_SUPPLIER_ID,
    supplierName: CADBURY_SUPPLIER_NAME,
    updatedAt: nowIso(),
  },
  {
    id: uid(),
    productName: "Bournville",
    type: "Dark Chocolate",
    quantity: 280,
    distributionLocation: "Kolkata DC",
    price: 80,
    expiryDate: new Date(Date.now() + 220 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    stockStatus: "in_stock",
    supplierId: CADBURY_SUPPLIER_ID,
    supplierName: CADBURY_SUPPLIER_NAME,
    updatedAt: nowIso(),
  },
];

// --- Query API (all operations scoped to Cadbury) ---

/** Add a new Cadbury product. Supplier is always set to Cadbury. */
export function addCadburyProduct(input: {
  productName: string;
  type: CadburyProductType;
  quantity: number;
  distributionLocation: string;
  price: number;
  expiryDate: string;
}): CadburyProduct {
  const status = computeStockStatus(input.quantity);
  const product: CadburyProduct = {
    id: uid(),
    ...input,
    stockStatus: status,
    supplierId: CADBURY_SUPPLIER_ID,
    supplierName: CADBURY_SUPPLIER_NAME,
    updatedAt: nowIso(),
  };
  products = [...products, product];
  return product;
}

/** Get all Cadbury products (only supplier in system). */
export function getCadburyProducts(): CadburyProduct[] {
  return products.filter((p) => p.supplierId === CADBURY_SUPPLIER_ID);
}

/** Track stock and distribution status for each Cadbury product. */
export function getCadburyStockAndDistributionStatus(): CadburyProduct[] {
  return getCadburyProducts().map((p) => ({
    ...p,
    stockStatus: computeStockStatus(p.quantity),
  }));
}

/** Update inventory: new stock arrival (positive delta) or sold (negative delta). */
export function updateCadburyInventory(
  productId: string,
  delta: number,
  reason?: "restock" | "sale" | "adjustment"
): CadburyProduct | null {
  const idx = products.findIndex((p) => p.id === productId && p.supplierId === CADBURY_SUPPLIER_ID);
  if (idx === -1) return null;
  const nextQty = Math.max(0, products[idx].quantity + delta);
  products = products.map((p, i) =>
    i === idx
      ? {
          ...p,
          quantity: nextQty,
          stockStatus: computeStockStatus(nextQty),
          updatedAt: nowIso(),
        }
      : p
  );
  return products[idx];
}

/** Report: distribution performance by location (Cadbury only). */
export function getCadburyDistributionReportByLocation(): DistributionPerformanceByLocation[] {
  const byLocation = new Map<string, { qty: number; value: number; low: number; out: number }>();
  for (const p of products) {
    if (p.supplierId !== CADBURY_SUPPLIER_ID) continue;
    const cur = byLocation.get(p.distributionLocation) ?? {
      qty: 0,
      value: 0,
      low: 0,
      out: 0,
    };
    cur.qty += p.quantity;
    cur.value += p.quantity * p.price;
    if (p.stockStatus === "low_stock") cur.low += 1;
    if (p.stockStatus === "out_of_stock") cur.out += 1;
    byLocation.set(p.distributionLocation, cur);
  }
  return Array.from(byLocation.entries()).map(([location, d]) => ({
    location,
    totalQuantity: d.qty,
    productCount: products.filter(
      (p) => p.distributionLocation === location && p.supplierId === CADBURY_SUPPLIER_ID
    ).length,
    totalValue: d.value,
    lowStockCount: d.low,
    outOfStockCount: d.out,
  }));
}

/** Report: distribution performance by product type (Cadbury only). */
export function getCadburyDistributionReportByProductType(): DistributionPerformanceByType[] {
  const byType = new Map<
    CadburyProductType,
    { qty: number; value: number; locations: Set<string> }
  >();
  for (const p of products) {
    if (p.supplierId !== CADBURY_SUPPLIER_ID) continue;
    const cur = byType.get(p.type) ?? { qty: 0, value: 0, locations: new Set<string>() };
    cur.qty += p.quantity;
    cur.value += p.quantity * p.price;
    cur.locations.add(p.distributionLocation);
    byType.set(p.type, cur);
  }
  return Array.from(byType.entries()).map(([productType, d]) => ({
    productType,
    totalQuantity: d.qty,
    productCount: products.filter((p) => p.type === productType && p.supplierId === CADBURY_SUPPLIER_ID).length,
    totalValue: d.value,
    locations: Array.from(d.locations),
  }));
}

/** Get a single Cadbury product by id. */
export function getCadburyProductById(id: string): CadburyProduct | null {
  return products.find((p) => p.id === id && p.supplierId === CADBURY_SUPPLIER_ID) ?? null;
}
