// Multi-supplier supply chain: database types and enums.
// Supports Suppliers, Products, Deliveries, Retailers, Logs.

export type UserRole = "consumer" | "retailer";

export type DeliveryStatus = "pending" | "in_transit" | "delivered" | "delayed" | "cancelled";

export type ProductCategory = "chocolate" | "candy" | "snack" | "wafer" | "biscuit" | "confectionery";

export type ActionType = "viewed" | "updated" | "delivered" | "created" | "login";

/** Request status for workflow: Pending = open, Resolved = closed by supplier */
export type RequestStatus = "Pending" | "Resolved";

/** Fully dynamic: all fields from retailer submission. */
export interface RetailerRequest {
  requestId: string;
  retailerId: string;
  supplierId?: string;
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  type: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  /** Set when supplier resolves */
  resolvedAt?: string;
  resolutionNote?: string;
  resolvedBy?: "ai" | "manual";
}

/** Map position for live map (0–100 grid or lat/lng). */
export interface LocationCoordinates {
  x: number;
  y: number;
}

// --- Suppliers Table ---
export interface Supplier {
  supplierId: string;
  name: string;
  contactInfo: string;
  distributionRegions: string[];
  activeStatus: boolean;
  /** For live map: position on grid (0–100). */
  locationCoordinates?: LocationCoordinates;
}

/** Error types for live feed / map. */
export type LiveFeedErrorType =
  | "stock_shortage"
  | "transport_delay"
  | "manual_error"
  | "ai_detected"
  | "other";

export type LiveFeedStatus = "Active" | "Resolved";

/** LiveFeed Table: errors shown on map and in live feed. */
export interface LiveFeedEntry {
  feedId: string;
  errorType: LiveFeedErrorType;
  supplierId: string;
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  message: string;
  aiSuggestion?: string;
  status: LiveFeedStatus;
  timestamp: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

/** Supply shift: Supplier 1 → Supplier 2 (for map flow animation). */
export interface SupplyShift {
  shiftId: string;
  fromSupplierId: string;
  toSupplierId: string;
  productId?: string;
  productName?: string;
  quantity: number;
  timestamp: string;
  feedId?: string;
}

// --- Products Table ---
export interface Product {
  productId: string;
  name: string;
  supplierId: string;
  type: ProductCategory;
  category: string; // display category (e.g. chocolate, candy) — Products table: Category
  sku: string;
  quantityInStock: number;
  pricePerUnit: number;
  expiryDate: string; // ISO date
  distributionLocation: string;
  deliveryStatus: DeliveryStatus;
  description: string; // ingredients, packaging, weight, size
  updatedAt: string; // ISO datetime
}

// --- Deliveries Table (live tracking) ---
export interface Delivery {
  deliveryId: string;
  productId: string;
  supplierId: string;
  retailerId: string;
  status: DeliveryStatus;
  currentLocation: string;
  eta: string; // ISO datetime
  timestamp: string; // last update ISO
  shipmentId?: string;
  productBatch?: string;
  remainingQuantity?: number;
  history: DeliveryHistoryEntry[];
}

export interface DeliveryHistoryEntry {
  location: string;
  status: DeliveryStatus;
  timestamp: string;
}

// --- Retailers Table ---
export interface Retailer {
  retailerId: string;
  name: string;
  region: string;
  email: string;
  passwordHash: string; // demo: plain comparison
  authorizedSupplierIds: string[];
  authorizedProductIds: string[]; // empty = all from authorized suppliers
}

// --- Logs Table ---
export interface ActionLog {
  actionId: string;
  userId: string; // retailerId or "consumer"
  productId?: string;
  deliveryId?: string;
  timestamp: string;
  actionType: ActionType;
  details?: string;
}

// --- Consumer-facing delivery view (high-level) ---
export interface ConsumerDeliveryView {
  deliveryId: string;
  productName: string;
  status: string; // e.g. "Product in transit to Mumbai"
  estimatedArrival: string;
}

// --- Retailer-facing delivery view (detailed) ---
export interface RetailerDeliveryView {
  deliveryId: string;
  shipmentId: string;
  productId: string;
  productName: string;
  productBatch: string;
  supplierName: string;
  status: DeliveryStatus;
  currentLocation: string;
  eta: string;
  remainingQuantity: number;
  history: DeliveryHistoryEntry[];
}

// --- Analytics ---
export interface DeliveriesPerRegionReport {
  region: string;
  totalDeliveries: number;
  delivered: number;
  inTransit: number;
  delayed: number;
}

export interface StockLevelsReport {
  productId: string;
  productName: string;
  supplierName: string;
  quantity: number;
  location: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export interface SupplierPerformanceReport {
  supplierId: string;
  supplierName: string;
  totalDeliveries: number;
  onTimeRate: number;
  activeProducts: number;
}
