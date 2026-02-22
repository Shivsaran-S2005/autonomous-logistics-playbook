// Multi-supplier database: in-memory fallback OR Supabase-backed (when env configured).
// Tables: Suppliers, Products, Deliveries, Retailers, Logs, etc.

import { isSupabaseEnabled } from "@/lib/supabase";
import {
  getCache,
  initSupabaseDb,
  refetchRetailerRequests,
  subscribeToUpdates as subscribeSupabase,
  supabaseAddRetailerRequest,
  supabaseResolveRequest,
  supabaseAddLiveFeedEntry,
  supabaseUpdateFeedEntryStatus,
  supabaseUpdateDeliveryStatus,
  supabaseUpdateProductStock,
  supabaseAddSupplyShift,
} from "./db-supabase";
import type {
  Supplier,
  Product,
  Delivery,
  Retailer,
  ActionLog,
  RetailerRequest,
  LiveFeedEntry,
  LiveFeedErrorType,
  SupplyShift,
  DeliveryStatus,
  ProductCategory,
} from "./types";

/** Initialize Supabase-backed DB (fetch from remote). Call once at app startup. */
export async function initDb(): Promise<void> {
  await initSupabaseDb();
}

/** Refetch retailer requests from Supabase (for supplier page cross-tab sync). */
export { refetchRetailerRequests };

// Data source: Supabase cache when enabled, else in-memory
const _suppliers = () => (isSupabaseEnabled() ? getCache().suppliers : suppliers);
const _products = () => (isSupabaseEnabled() ? getCache().products : products);
const _retailers = () => (isSupabaseEnabled() ? getCache().retailers : retailers);
const _deliveries = () => (isSupabaseEnabled() ? getCache().deliveries : deliveries);
const _retailerRequests = () => (isSupabaseEnabled() ? getCache().retailerRequests : retailerRequests);
const _liveFeed = () => (isSupabaseEnabled() ? getCache().liveFeed : liveFeed);
const _supplyShifts = () => (isSupabaseEnabled() ? getCache().supplyShifts : supplyShifts);
const _logs = () => (isSupabaseEnabled() ? getCache().logs : logs);

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function nowIso() {
  return new Date().toISOString();
}

// ============ SUPPLIERS TABLE (with Location_Coordinates for live map) ============
const suppliers: Supplier[] = [
  {
    supplierId: "sup_cadbury",
    name: "Cadbury",
    contactInfo: "contact@cadbury.com, +91-22-12345678",
    distributionRegions: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"],
    activeStatus: true,
    locationCoordinates: { x: 15, y: 25 },
  },
  {
    supplierId: "sup_nestle",
    name: "Nestle",
    contactInfo: "supply@nestle.in, +91-44-87654321",
    distributionRegions: ["Chennai", "Mumbai", "Delhi", "Hyderabad"],
    activeStatus: true,
    locationCoordinates: { x: 50, y: 20 },
  },
  {
    supplierId: "sup_ferrero",
    name: "Ferrero",
    contactInfo: "india@ferrero.com, +91-80-22334455",
    distributionRegions: ["Bangalore", "Mumbai", "Delhi"],
    activeStatus: true,
    locationCoordinates: { x: 80, y: 30 },
  },
  {
    supplierId: "sup_mars",
    name: "Mars",
    contactInfo: "mars.supply@mars.com, +91-11-33445566",
    distributionRegions: ["Delhi", "Mumbai", "Pune"],
    activeStatus: true,
    locationCoordinates: { x: 25, y: 70 },
  },
  {
    supplierId: "sup_hersheys",
    name: "Hershey's",
    contactInfo: "apac@hersheys.com, +91-33-44556677",
    distributionRegions: ["Kolkata", "Mumbai", "Delhi"],
    activeStatus: true,
    locationCoordinates: { x: 75, y: 75 },
  },
];

// ============ PRODUCTS TABLE (multi-supplier) ============
const products: Product[] = [
  // Cadbury
  {
    productId: "prod_5star",
    name: "5 Star",
    supplierId: "sup_cadbury",
    type: "chocolate",
    category: "chocolate",
    sku: "CAD-5ST-001",
    quantityInStock: 450,
    pricePerUnit: 30,
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Mumbai DC",
    deliveryStatus: "in_transit",
    description: "Milk chocolate with caramel and nougat. 45g bar. Ingredients: Sugar, milk, cocoa butter.",
    updatedAt: nowIso(),
  },
  {
    productId: "prod_dairymilk",
    name: "Dairy Milk",
    supplierId: "sup_cadbury",
    type: "chocolate",
    category: "chocolate",
    sku: "CAD-DM-002",
    quantityInStock: 620,
    pricePerUnit: 50,
    expiryDate: new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Delhi DC",
    deliveryStatus: "delivered",
    description: "Cadbury Dairy Milk 60g. Milk chocolate. Ingredients: Milk, sugar, cocoa mass.",
    updatedAt: nowIso(),
  },
  {
    productId: "prod_perk",
    name: "Perk",
    supplierId: "sup_cadbury",
    type: "wafer",
    category: "wafer",
    sku: "CAD-PRK-003",
    quantityInStock: 380,
    pricePerUnit: 20,
    expiryDate: new Date(Date.now() + 160 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Bangalore DC",
    deliveryStatus: "pending",
    description: "Chocolate-coated wafer. 27g. Contains wheat, milk.",
    updatedAt: nowIso(),
  },
  {
    productId: "prod_gems",
    name: "Gems",
    supplierId: "sup_cadbury",
    type: "confectionery",
    category: "confectionery",
    sku: "CAD-GEM-004",
    quantityInStock: 15,
    pricePerUnit: 10,
    expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Chennai DC",
    deliveryStatus: "in_transit",
    description: "Colorful candy-coated chocolate buttons. 40g pack.",
    updatedAt: nowIso(),
  },
  {
    productId: "prod_bournville",
    name: "Bournville",
    supplierId: "sup_cadbury",
    type: "chocolate",
    category: "chocolate",
    sku: "CAD-BV-005",
    quantityInStock: 280,
    pricePerUnit: 80,
    expiryDate: new Date(Date.now() + 220 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Kolkata DC",
    deliveryStatus: "delivered",
    description: "Dark chocolate 80g. Cocoa 50%.",
    updatedAt: nowIso(),
  },
  // Nestle
  {
    productId: "prod_kitkat",
    name: "Kit Kat",
    supplierId: "sup_nestle",
    type: "chocolate",
    category: "chocolate",
    sku: "NES-KK-001",
    quantityInStock: 520,
    pricePerUnit: 25,
    expiryDate: new Date(Date.now() + 190 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Chennai DC",
    deliveryStatus: "in_transit",
    description: "Chocolate-covered wafer fingers. 45g. Nestle.",
    updatedAt: nowIso(),
  },
  {
    productId: "prod_munch",
    name: "Munch",
    supplierId: "sup_nestle",
    type: "snack",
    category: "snack",
    sku: "NES-MUN-002",
    quantityInStock: 340,
    pricePerUnit: 15,
    expiryDate: new Date(Date.now() + 170 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Mumbai DC",
    deliveryStatus: "pending",
    description: "Chocolate-coated biscuit. 28g.",
    updatedAt: nowIso(),
  },
  // Ferrero
  {
    productId: "prod_ferrero",
    name: "Ferrero Rocher",
    supplierId: "sup_ferrero",
    type: "chocolate",
    category: "chocolate",
    sku: "FER-FR-001",
    quantityInStock: 120,
    pricePerUnit: 250,
    expiryDate: new Date(Date.now() + 240 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Bangalore DC",
    deliveryStatus: "delivered",
    description: "Hazelnut chocolate in gold wrapper. 3 balls 36g.",
    updatedAt: nowIso(),
  },
  {
    productId: "prod_nutella",
    name: "Nutella",
    supplierId: "sup_ferrero",
    type: "chocolate",
    category: "chocolate",
    sku: "FER-NUT-002",
    quantityInStock: 200,
    pricePerUnit: 450,
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Mumbai DC",
    deliveryStatus: "in_transit",
    description: "Hazelnut cocoa spread. 350g jar.",
    updatedAt: nowIso(),
  },
  // Mars
  {
    productId: "prod_snickers",
    name: "Snickers",
    supplierId: "sup_mars",
    type: "chocolate",
    category: "chocolate",
    sku: "MAR-SNK-001",
    quantityInStock: 380,
    pricePerUnit: 40,
    expiryDate: new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Delhi DC",
    deliveryStatus: "delayed",
    description: "Peanut chocolate bar. 50g.",
    updatedAt: nowIso(),
  },
  {
    productId: "prod_mms",
    name: "M&M's",
    supplierId: "sup_mars",
    type: "candy",
    category: "candy",
    sku: "MAR-MMS-002",
    quantityInStock: 260,
    pricePerUnit: 35,
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Pune DC",
    deliveryStatus: "in_transit",
    description: "Colorful chocolate candies. 45g pack.",
    updatedAt: nowIso(),
  },
  // Hershey's
  {
    productId: "prod_hersheys_bar",
    name: "Hershey's Milk Chocolate",
    supplierId: "sup_hersheys",
    type: "chocolate",
    category: "chocolate",
    sku: "HER-MC-001",
    quantityInStock: 180,
    pricePerUnit: 60,
    expiryDate: new Date(Date.now() + 210 * 86400000).toISOString().slice(0, 10),
    distributionLocation: "Kolkata DC",
    deliveryStatus: "pending",
    description: "Classic milk chocolate bar. 43g.",
    updatedAt: nowIso(),
  },
];

// ============ RETAILERS TABLE ============
const retailers: Retailer[] = [
  {
    retailerId: "ret_mumbai_1",
    name: "Mumbai Central Retail",
    region: "Mumbai",
    email: "retailer@mumbai.com",
    passwordHash: "retailer123", // demo only
    authorizedSupplierIds: ["sup_cadbury", "sup_nestle", "sup_ferrero"],
    authorizedProductIds: [],
  },
  {
    retailerId: "ret_delhi_1",
    name: "Delhi North Retail",
    region: "Delhi",
    email: "retailer@delhi.com",
    passwordHash: "retailer123",
    authorizedSupplierIds: ["sup_cadbury", "sup_mars", "sup_hersheys"],
    authorizedProductIds: [],
  },
  {
    retailerId: "ret_bangalore_1",
    name: "Bangalore South Retail",
    region: "Bangalore",
    email: "retailer@bangalore.com",
    passwordHash: "retailer123",
    authorizedSupplierIds: ["sup_cadbury", "sup_nestle", "sup_ferrero", "sup_mars"],
    authorizedProductIds: [],
  },
];

// ============ DELIVERIES TABLE (live tracking) ============
const deliveries: Delivery[] = [
  {
    deliveryId: "del_001",
    productId: "prod_5star",
    supplierId: "sup_cadbury",
    retailerId: "ret_mumbai_1",
    status: "in_transit",
    currentLocation: "En route to Mumbai (NH48)",
    eta: new Date(Date.now() + 4 * 3600000).toISOString(),
    timestamp: nowIso(),
    shipmentId: "SHP-CAD-2024-001",
    productBatch: "BATCH-5ST-Oct24",
    remainingQuantity: 1200,
    history: [
      { location: "Mumbai DC", status: "pending", timestamp: new Date(Date.now() - 86400000).toISOString() },
      { location: "Vapi Hub", status: "in_transit", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { location: "En route to Mumbai (NH48)", status: "in_transit", timestamp: nowIso() },
    ],
  },
  {
    deliveryId: "del_002",
    productId: "prod_dairymilk",
    supplierId: "sup_cadbury",
    retailerId: "ret_delhi_1",
    status: "delivered",
    currentLocation: "Delhi North Retail",
    eta: new Date(Date.now() - 3600000).toISOString(),
    timestamp: nowIso(),
    shipmentId: "SHP-CAD-2024-002",
    productBatch: "BATCH-DM-Oct24",
    remainingQuantity: 0,
    history: [
      { location: "Delhi DC", status: "pending", timestamp: new Date(Date.now() - 172800000).toISOString() },
      { location: "Delhi North Retail", status: "delivered", timestamp: nowIso() },
    ],
  },
  {
    deliveryId: "del_003",
    productId: "prod_snickers",
    supplierId: "sup_mars",
    retailerId: "ret_delhi_1",
    status: "delayed",
    currentLocation: "Agra checkpoint",
    eta: new Date(Date.now() + 12 * 3600000).toISOString(),
    timestamp: nowIso(),
    shipmentId: "SHP-MAR-2024-003",
    productBatch: "BATCH-SNK-Nov24",
    remainingQuantity: 800,
    history: [
      { location: "Delhi DC", status: "pending", timestamp: new Date(Date.now() - 259200000).toISOString() },
      { location: "Agra checkpoint", status: "delayed", timestamp: nowIso() },
    ],
  },
  {
    deliveryId: "del_004",
    productId: "prod_kitkat",
    supplierId: "sup_nestle",
    retailerId: "ret_bangalore_1",
    status: "in_transit",
    currentLocation: "Bengaluru outskirts",
    eta: new Date(Date.now() + 2 * 3600000).toISOString(),
    timestamp: nowIso(),
    shipmentId: "SHP-NES-2024-004",
    productBatch: "BATCH-KK-Nov24",
    remainingQuantity: 600,
    history: [
      { location: "Chennai DC", status: "pending", timestamp: new Date(Date.now() - 43200000).toISOString() },
      { location: "Bengaluru outskirts", status: "in_transit", timestamp: nowIso() },
    ],
  },
];

// ============ LOGS TABLE ============
const logs: ActionLog[] = [];

// ============ RETAILER REQUESTS (restock, delay report) ============
const retailerRequests: RetailerRequest[] = [];

const RETAILER_REQUESTS_STORAGE_KEY = "sc_retailer_requests";

function persistRetailerRequests() {
  try {
    localStorage.setItem(RETAILER_REQUESTS_STORAGE_KEY, JSON.stringify(retailerRequests));
  } catch {
    // ignore
  }
}

function loadRetailerRequestsFromStorage() {
  try {
    const raw = localStorage.getItem(RETAILER_REQUESTS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as RetailerRequest[];
    if (Array.isArray(parsed)) {
      retailerRequests.length = 0;
      retailerRequests.push(...parsed);
    }
  } catch {
    // ignore
  }
}

if (typeof window !== "undefined") {
  loadRetailerRequestsFromStorage();
  window.addEventListener("storage", (e) => {
    if (e.key === RETAILER_REQUESTS_STORAGE_KEY) {
      loadRetailerRequestsFromStorage();
      notify();
    }
  });
}

// ============ LIVE FEED TABLE (errors for map + feed) ============
const liveFeed: LiveFeedEntry[] = [
  {
    feedId: "feed_sample_1",
    errorType: "stock_shortage",
    supplierId: "sup_cadbury",
    productId: "prod_gems",
    productName: "Gems",
    category: "confectionery",
    quantity: 50,
    message: "Low stock detected. Gems below reorder level.",
    aiSuggestion: "Reroute to Nestle or Ferrero for same category.",
    status: "Active",
    timestamp: nowIso(),
  },
];

// ============ SUPPLY SHIFTS (Supplier 1 → Supplier 2 for flow animation) ============
const supplyShifts: SupplyShift[] = [];

// --- Subscribers for live updates (UI refresh every 30–60s) ---
type Listener = () => void;
const listeners: Set<Listener> = new Set();
export function subscribeToUpdates(cb: Listener) {
  if (isSupabaseEnabled()) return subscribeSupabase(cb);
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notify() {
  listeners.forEach((cb) => cb());
}

// ============ QUERIES & OPERATIONS ============

export function getSuppliers(): Supplier[] {
  return _suppliers().filter((s) => s.activeStatus);
}

export function getSupplierById(id: string): Supplier | undefined {
  return _suppliers().find((s) => s.supplierId === id);
}

export function addRetailerRequest(input: {
  retailerId: string;
  type: string;
  supplierId?: string;
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  message: string;
}): RetailerRequest {
  if (isSupabaseEnabled()) return supabaseAddRetailerRequest(input);
  const req: RetailerRequest = {
    requestId: uid("req"),
    ...input,
    status: "Pending",
    createdAt: nowIso(),
  };
  retailerRequests.push(req);
  persistRetailerRequests();
  notify();
  return req;
}

export function getRetailerRequests(retailerId: string): RetailerRequest[] {
  return _retailerRequests().filter((r) => r.retailerId === retailerId);
}

/** All requests (for supplier dashboard) — retailer and supplier linked */
export function getAllRequests(): RetailerRequest[] {
  return [..._retailerRequests()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getRequestById(requestId: string): RetailerRequest | undefined {
  return _retailerRequests().find((r) => r.requestId === requestId);
}

// ============ LIVE FEED & SUPPLY SHIFTS ============

export function getLiveFeedEntries(): LiveFeedEntry[] {
  return [..._liveFeed()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function addLiveFeedEntry(input: {
  errorType: LiveFeedErrorType;
  supplierId: string;
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  message: string;
  aiSuggestion?: string;
}): LiveFeedEntry {
  if (isSupabaseEnabled()) return supabaseAddLiveFeedEntry(input);
  const entry: LiveFeedEntry = {
    feedId: uid("feed"),
    ...input,
    status: "Active",
    timestamp: nowIso(),
  };
  liveFeed.push(entry);
  notify();
  return entry;
}

export function getFeedEntryById(feedId: string): LiveFeedEntry | undefined {
  return _liveFeed().find((e) => e.feedId === feedId);
}

export function updateFeedEntryStatus(
  feedId: string,
  status: "Resolved",
  resolutionNote?: string
): LiveFeedEntry | undefined {
  if (isSupabaseEnabled()) return supabaseUpdateFeedEntryStatus(feedId, status, resolutionNote);
  const e = liveFeed.find((x) => x.feedId === feedId);
  if (!e) return undefined;
  e.status = status;
  e.resolvedAt = nowIso();
  if (resolutionNote) e.resolutionNote = resolutionNote;
  notify();
  return e;
}

/** Supplier IDs that have at least one Active feed entry (for map red points). */
export function getSupplierIdsWithActiveErrors(): Set<string> {
  const set = new Set<string>();
  for (const e of _liveFeed()) {
    if (e.status === "Active") set.add(e.supplierId);
  }
  return set;
}

export function addSupplyShift(input: {
  fromSupplierId: string;
  toSupplierId: string;
  productId?: string;
  productName?: string;
  quantity: number;
  feedId?: string;
}): SupplyShift {
  if (isSupabaseEnabled()) return supabaseAddSupplyShift(input);
  const shift: SupplyShift = {
    shiftId: uid("shift"),
    ...input,
    timestamp: nowIso(),
  };
  supplyShifts.push(shift);
  if (supplyShifts.length > 20) supplyShifts.shift();
  notify();
  return shift;
}

/** Recent shifts for map flow animation (e.g. last 10). */
export function getRecentSupplyShifts(): SupplyShift[] {
  return [..._supplyShifts()]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

/** Auto: pick alternate supplier for same product category (for supply switch). */
export function getAlternateSupplierForProduct(
  excludeSupplierId: string,
  productId?: string
): Supplier | undefined {
  const product = productId ? getProductById(productId) : null;
  const category = product?.category;
  return _suppliers().find(
    (s) =>
      s.supplierId !== excludeSupplierId &&
      s.activeStatus &&
      (category
        ? _products().some((p) => p.supplierId === s.supplierId && p.category === category)
        : true)
  );
}

export function resolveRequest(
  requestId: string,
  resolutionNote: string,
  resolvedBy: "ai" | "manual"
): RetailerRequest | undefined {
  if (isSupabaseEnabled()) return supabaseResolveRequest(requestId, resolutionNote, resolvedBy);
  const r = retailerRequests.find((x) => x.requestId === requestId);
  if (!r) return undefined;
  r.status = "Resolved";
  r.resolvedAt = nowIso();
  r.resolutionNote = resolutionNote;
  r.resolvedBy = resolvedBy;
  persistRetailerRequests();
  notify();
  return r;
}

export function addSupplier(input: Omit<Supplier, "supplierId">): Supplier {
  const supplier: Supplier = {
    supplierId: uid("sup"),
    ...input,
  };
  suppliers.push(supplier);
  notify();
  return supplier;
}

export function getProducts(filters?: {
  supplierId?: string;
  type?: ProductCategory;
  inStockOnly?: boolean;
}): Product[] {
  let list = [..._products()];
  if (filters?.supplierId) list = list.filter((p) => p.supplierId === filters.supplierId);
  if (filters?.type) list = list.filter((p) => p.type === filters.type);
  if (filters?.inStockOnly) list = list.filter((p) => p.quantityInStock > 0);
  return list;
}

export function getProductById(id: string): Product | undefined {
  return _products().find((p) => p.productId === id);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return _products().filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

export function addProduct(input: Omit<Product, "productId" | "updatedAt">): Product {
  const product: Product = {
    productId: uid("prod"),
    ...input,
    updatedAt: nowIso(),
  };
  products.push(product);
  notify();
  return product;
}

export function updateProductStock(productId: string, quantity: number): Product | undefined {
  if (isSupabaseEnabled()) return supabaseUpdateProductStock(productId, quantity);
  const p = products.find((x) => x.productId === productId);
  if (!p) return undefined;
  p.quantityInStock = Math.max(0, quantity);
  p.updatedAt = nowIso();
  notify();
  return p;
}

export function updateProduct(
  productId: string,
  updates: Partial<Pick<Product, "pricePerUnit" | "expiryDate" | "distributionLocation" | "deliveryStatus">>
): Product | undefined {
  const p = products.find((x) => x.productId === productId);
  if (!p) return undefined;
  Object.assign(p, updates, { updatedAt: nowIso() });
  notify();
  return p;
}

export function getDeliveries(): Delivery[] {
  return [..._deliveries()];
}

export function getDeliveriesByRetailer(retailerId: string): Delivery[] {
  return _deliveries().filter((d) => d.retailerId === retailerId);
}

export function getDeliveriesByProduct(productId: string): Delivery[] {
  return _deliveries().filter((d) => d.productId === productId);
}

export function getDeliveryById(deliveryId: string): Delivery | undefined {
  return _deliveries().find((d) => d.deliveryId === deliveryId);
}

export function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  currentLocation?: string,
  eta?: string
): Delivery | undefined {
  if (isSupabaseEnabled()) return supabaseUpdateDeliveryStatus(deliveryId, status, currentLocation, eta);
  const d = deliveries.find((x) => x.deliveryId === deliveryId);
  if (!d) return undefined;
  d.status = status;
  if (currentLocation) d.currentLocation = currentLocation;
  if (eta) d.eta = eta;
  d.timestamp = nowIso();
  d.history.push({
    location: d.currentLocation,
    status: d.status,
    timestamp: d.timestamp,
  });
  notify();
  return d;
}

export function getRetailerByEmail(email: string): Retailer | undefined {
  return _retailers().find((r) => r.email.toLowerCase() === email.toLowerCase());
}

export function getRetailerById(id: string): Retailer | undefined {
  return _retailers().find((r) => r.retailerId === id);
}

export function validateRetailerLogin(email: string, password: string): Retailer | null {
  const r = getRetailerByEmail(email);
  if (!r || r.passwordHash !== password) return null;
  return r;
}

export function addLog(entry: Omit<ActionLog, "actionId" | "timestamp">): ActionLog {
  const log: ActionLog = {
    actionId: uid("log"),
    ...entry,
    timestamp: nowIso(),
  };
  logs.push(log);
  return log;
}

// --- Consumer delivery view (high-level) ---
export function getConsumerDeliveryViews(): import("./types").ConsumerDeliveryView[] {
  const supMap = new Map(_suppliers().map((s) => [s.supplierId, s.name]));
  const prodMap = new Map(_products().map((p) => [p.productId, p.name]));
  return _deliveries().map((d) => {
    const productName = prodMap.get(d.productId) ?? "Product";
    const statusText =
      d.status === "delivered"
        ? "Delivered"
        : d.status === "in_transit"
          ? `In transit to ${d.currentLocation}`
          : d.status === "delayed"
            ? `Delayed — ${d.currentLocation}`
            : "Pending";
    return {
      deliveryId: d.deliveryId,
      productName,
      status: statusText,
      estimatedArrival: d.eta,
    };
  });
}

// --- Retailer delivery view (detailed, filtered by authorization) ---
export function getRetailerDeliveryViews(retailerId: string): import("./types").RetailerDeliveryView[] {
  const r = getRetailerById(retailerId);
  if (!r) return [];
  const allowed = r.authorizedSupplierIds;
  const prodMap = new Map(_products().map((p) => [p.productId, p]));
  const supMap = new Map(_suppliers().map((s) => [s.supplierId, s.name]));
  return _deliveries()
    .filter((d) => d.retailerId === retailerId && allowed.includes(d.supplierId))
    .map((d) => {
      const p = prodMap.get(d.productId);
      return {
        deliveryId: d.deliveryId,
        shipmentId: d.shipmentId ?? "",
        productId: d.productId,
        productName: p?.name ?? "",
        productBatch: d.productBatch ?? "",
        supplierName: supMap.get(d.supplierId) ?? "",
        status: d.status,
        currentLocation: d.currentLocation,
        eta: d.eta,
        remainingQuantity: d.remainingQuantity ?? 0,
        history: d.history,
      };
    });
}

// --- Analytics ---
export function getDeliveriesPerRegion(): import("./types").DeliveriesPerRegionReport[] {
  const byRegion = new Map<string, { total: number; delivered: number; inTransit: number; delayed: number }>();
  for (const d of _deliveries()) {
    const r = getRetailerById(d.retailerId);
    const region = r?.region ?? "Unknown";
    const cur = byRegion.get(region) ?? { total: 0, delivered: 0, inTransit: 0, delayed: 0 };
    cur.total++;
    if (d.status === "delivered") cur.delivered++;
    else if (d.status === "in_transit") cur.inTransit++;
    else if (d.status === "delayed") cur.delayed++;
    byRegion.set(region, cur);
  }
  return Array.from(byRegion.entries()).map(([region, d]) => ({
    region,
    totalDeliveries: d.total,
    delivered: d.delivered,
    inTransit: d.inTransit,
    delayed: d.delayed,
  }));
}

export function getStockLevelsReport(): import("./types").StockLevelsReport[] {
  const supMap = new Map(_suppliers().map((s) => [s.supplierId, s.name]));
  return _products().map((p) => ({
    productId: p.productId,
    productName: p.name,
    supplierName: supMap.get(p.supplierId) ?? "",
    quantity: p.quantityInStock,
    location: p.distributionLocation,
    status:
      p.quantityInStock <= 0 ? "out_of_stock" : p.quantityInStock < 30 ? "low_stock" : "in_stock",
  }));
}

export function getSupplierPerformanceReport(): import("./types").SupplierPerformanceReport[] {
  const delivered = new Map<string, number>();
  const total = new Map<string, number>();
  for (const d of _deliveries()) {
    total.set(d.supplierId, (total.get(d.supplierId) ?? 0) + 1);
    if (d.status === "delivered") delivered.set(d.supplierId, (delivered.get(d.supplierId) ?? 0) + 1);
  }
  return _suppliers().filter((s) => s.activeStatus).map((s) => ({
    supplierId: s.supplierId,
    supplierName: s.name,
    totalDeliveries: total.get(s.supplierId) ?? 0,
    onTimeRate: total.get(s.supplierId)
      ? ((delivered.get(s.supplierId) ?? 0) / (total.get(s.supplierId) ?? 1)) * 100
      : 0,
    activeProducts: _products().filter((p) => p.supplierId === s.supplierId).length,
  }));
}
