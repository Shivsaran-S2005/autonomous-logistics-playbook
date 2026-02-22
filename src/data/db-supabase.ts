/**
 * Supabase-backed data layer. Mirrors db.ts API.
 * Uses in-memory cache; hydrates from Supabase on init; writes go to Supabase + cache.
 */

import { supabase, isSupabaseEnabled } from "@/lib/supabase";
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

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function nowIso() {
  return new Date().toISOString();
}

// In-memory cache (snake_case from DB -> camelCase in app)
const cache = {
  suppliers: [] as Supplier[],
  products: [] as Product[],
  retailers: [] as Retailer[],
  deliveries: [] as Delivery[],
  retailerRequests: [] as RetailerRequest[],
  liveFeed: [] as LiveFeedEntry[],
  supplyShifts: [] as SupplyShift[],
  logs: [] as ActionLog[],
};

const listeners = new Set<() => void>();
export function subscribeToUpdates(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function notify() {
  listeners.forEach((cb) => cb());
}

function rowToSupplier(r: Record<string, unknown>): Supplier {
  return {
    supplierId: r.supplier_id as string,
    name: r.name as string,
    contactInfo: (r.contact_info as string) ?? "",
    distributionRegions: Array.isArray(r.distribution_regions) ? (r.distribution_regions as string[]) : (r.distribution_regions as string) ? JSON.parse(r.distribution_regions as string) : [],
    activeStatus: (r.active_status as boolean) ?? true,
    locationCoordinates: r.location_x != null && r.location_y != null ? { x: r.location_x as number, y: r.location_y as number } : undefined,
  };
}
function rowToProduct(r: Record<string, unknown>): Product {
  return {
    productId: r.product_id as string,
    name: r.name as string,
    supplierId: r.supplier_id as string,
    type: r.type as ProductCategory,
    category: r.category as string,
    sku: r.sku as string,
    quantityInStock: (r.quantity_in_stock as number) ?? 0,
    pricePerUnit: (r.price_per_unit as number) ?? 0,
    expiryDate: (r.expiry_date as string) ?? "",
    distributionLocation: (r.distribution_location as string) ?? "",
    deliveryStatus: (r.delivery_status as string) as DeliveryStatus ?? "pending",
    description: (r.description as string) ?? "",
    updatedAt: (r.updated_at as string) ?? nowIso(),
  };
}
function rowToRetailer(r: Record<string, unknown>): Retailer {
  const authSupp = r.authorized_supplier_ids;
  const authProd = r.authorized_product_ids;
  return {
    retailerId: r.retailer_id as string,
    name: r.name as string,
    region: (r.region as string) ?? "",
    email: r.email as string,
    passwordHash: r.password_hash as string,
    authorizedSupplierIds: Array.isArray(authSupp) ? authSupp as string[] : (typeof authSupp === "string" ? JSON.parse(authSupp || "[]") : []),
    authorizedProductIds: Array.isArray(authProd) ? authProd as string[] : (typeof authProd === "string" ? JSON.parse(authProd || "[]") : []),
  };
}
function rowToDelivery(r: Record<string, unknown>): Delivery {
  const h = r.history;
  return {
    deliveryId: r.delivery_id as string,
    productId: r.product_id as string,
    supplierId: r.supplier_id as string,
    retailerId: r.retailer_id as string,
    status: r.status as DeliveryStatus,
    currentLocation: (r.current_location as string) ?? "",
    eta: (r.eta as string) ?? "",
    timestamp: (r.timestamp as string) ?? nowIso(),
    shipmentId: r.shipment_id as string | undefined,
    productBatch: r.product_batch as string | undefined,
    remainingQuantity: r.remaining_quantity as number | undefined,
    history: Array.isArray(h) ? h as { location: string; status: DeliveryStatus; timestamp: string }[] : (typeof h === "string" ? JSON.parse(h || "[]") : []),
  };
}
function rowToRequest(r: Record<string, unknown>): RetailerRequest {
  return {
    requestId: r.request_id as string,
    retailerId: r.retailer_id as string,
    supplierId: r.supplier_id as string | undefined,
    productId: r.product_id as string | undefined,
    productName: r.product_name as string | undefined,
    category: r.category as string | undefined,
    quantity: r.quantity as number | undefined,
    type: r.type as string,
    message: r.message as string,
    status: r.status as "Pending" | "Resolved",
    createdAt: r.created_at as string,
    resolvedAt: r.resolved_at as string | undefined,
    resolutionNote: r.resolution_note as string | undefined,
    resolvedBy: r.resolved_by as "ai" | "manual" | undefined,
  };
}
function rowToLiveFeed(r: Record<string, unknown>): LiveFeedEntry {
  return {
    feedId: r.feed_id as string,
    errorType: r.error_type as LiveFeedErrorType,
    supplierId: r.supplier_id as string,
    productId: r.product_id as string | undefined,
    productName: r.product_name as string | undefined,
    category: r.category as string | undefined,
    quantity: r.quantity as number | undefined,
    message: r.message as string,
    aiSuggestion: r.ai_suggestion as string | undefined,
    status: r.status as "Active" | "Resolved",
    timestamp: r.timestamp as string,
    resolvedAt: r.resolved_at as string | undefined,
    resolutionNote: r.resolution_note as string | undefined,
  };
}
function rowToSupplyShift(r: Record<string, unknown>): SupplyShift {
  return {
    shiftId: r.shift_id as string,
    fromSupplierId: r.from_supplier_id as string,
    toSupplierId: r.to_supplier_id as string,
    productId: r.product_id as string | undefined,
    productName: r.product_name as string | undefined,
    quantity: r.quantity as number,
    timestamp: r.timestamp as string,
    feedId: r.feed_id as string | undefined,
  };
}

export async function initSupabaseDb(): Promise<void> {
  if (!supabase || !isSupabaseEnabled()) return;

  try {
    const [sRes, pRes, rRes, dRes, reqRes, lfRes, ssRes, logRes] = await Promise.all([
      supabase.from("suppliers").select("*"),
      supabase.from("products").select("*"),
      supabase.from("retailers").select("*"),
      supabase.from("deliveries").select("*"),
      supabase.from("retailer_requests").select("*"),
      supabase.from("live_feed").select("*"),
      supabase.from("supply_shifts").select("*"),
      supabase.from("action_logs").select("*"),
    ]);

    if (sRes.data) cache.suppliers = (sRes.data as Record<string, unknown>[]).map(rowToSupplier);
    if (pRes.data) cache.products = (pRes.data as Record<string, unknown>[]).map(rowToProduct);
    if (rRes.data) cache.retailers = (rRes.data as Record<string, unknown>[]).map(rowToRetailer);
    if (dRes.data) cache.deliveries = (dRes.data as Record<string, unknown>[]).map(rowToDelivery);
    // Merge requests: keep local additions, add any from fetch we don't have (avoids race with user adds)
    if (reqRes.data) {
      const fetched = (reqRes.data as Record<string, unknown>[]).map(rowToRequest);
      const byId = new Map(cache.retailerRequests.map((r) => [r.requestId, r]));
      for (const r of fetched) {
        if (!byId.has(r.requestId)) byId.set(r.requestId, r);
      }
      cache.retailerRequests = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (lfRes.data) cache.liveFeed = (lfRes.data as Record<string, unknown>[]).map(rowToLiveFeed);
    if (ssRes.data) cache.supplyShifts = (ssRes.data as Record<string, unknown>[]).map(rowToSupplyShift);
    if (logRes.data) cache.logs = (logRes.data as Record<string, unknown>[]).map((r) => ({
      actionId: r.action_id as string,
      userId: r.user_id as string,
      productId: r.product_id as string | undefined,
      deliveryId: r.delivery_id as string | undefined,
      timestamp: r.timestamp as string,
      actionType: r.action_type as string,
      details: r.details as string | undefined,
    }));
  } catch (err) {
    console.warn("[db-supabase] Init failed:", err);
  }
  notify();
}

// Re-export cache for reads (used by db.ts when delegating)
export function getCache() {
  return cache;
}

/** Refetch retailer_requests from Supabase and merge into cache. Call periodically for cross-tab sync. */
export async function refetchRetailerRequests(): Promise<void> {
  if (!supabase || !isSupabaseEnabled()) return;
  try {
    const { data } = await supabase.from("retailer_requests").select("*");
    if (!data) return;
    const fetched = (data as Record<string, unknown>[]).map(rowToRequest);
    // Start from fetched; add any in cache that aren't in fetch yet (e.g. just inserted)
    const byId = new Map(fetched.map((r) => [r.requestId, r]));
    for (const r of cache.retailerRequests) {
      if (!byId.has(r.requestId)) byId.set(r.requestId, r);
    }
    cache.retailerRequests = Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    notify();
  } catch (err) {
    console.warn("[db-supabase] refetchRetailerRequests:", err);
  }
}

// Write helpers (sync API: update cache + fire-and-forget to Supabase)
export function supabaseAddRetailerRequest(input: {
  retailerId: string;
  type: string;
  supplierId?: string;
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  message: string;
}): RetailerRequest {
  const req: RetailerRequest = {
    requestId: uid("req"),
    ...input,
    status: "Pending",
    createdAt: nowIso(),
  };
  cache.retailerRequests.push(req);
  if (supabase) {
    supabase.from("retailer_requests").insert({
      request_id: req.requestId,
      retailer_id: req.retailerId,
      supplier_id: req.supplierId ?? null,
      product_id: req.productId ?? null,
      product_name: req.productName ?? null,
      category: req.category ?? null,
      quantity: req.quantity ?? null,
      type: req.type,
      message: req.message,
      status: req.status,
      created_at: req.createdAt,
    }).then(({ error }) => { if (error) console.warn("[db-supabase] insert request:", error); });
  }
  notify();
  return req;
}

export function supabaseResolveRequest(requestId: string, resolutionNote: string, resolvedBy: "ai" | "manual"): RetailerRequest | undefined {
  const r = cache.retailerRequests.find((x) => x.requestId === requestId);
  if (!r) return undefined;
  r.status = "Resolved";
  r.resolvedAt = nowIso();
  r.resolutionNote = resolutionNote;
  r.resolvedBy = resolvedBy;
  if (supabase) {
    supabase.from("retailer_requests").update({
      status: "Resolved",
      resolved_at: r.resolvedAt,
      resolution_note: resolutionNote,
      resolved_by: resolvedBy,
    }).eq("request_id", requestId).then(({ error }) => { if (error) console.warn("[db-supabase] update request:", error); });
  }
  notify();
  return r;
}

export function supabaseAddLiveFeedEntry(input: {
  errorType: LiveFeedErrorType;
  supplierId: string;
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  message: string;
  aiSuggestion?: string;
}): LiveFeedEntry {
  const entry: LiveFeedEntry = {
    feedId: uid("feed"),
    ...input,
    status: "Active",
    timestamp: nowIso(),
  };
  cache.liveFeed.push(entry);
  if (supabase) {
    supabase.from("live_feed").insert({
      feed_id: entry.feedId,
      error_type: entry.errorType,
      supplier_id: entry.supplierId,
      product_id: entry.productId ?? null,
      product_name: entry.productName ?? null,
      category: entry.category ?? null,
      quantity: entry.quantity ?? null,
      message: entry.message,
      ai_suggestion: entry.aiSuggestion ?? null,
      status: entry.status,
      timestamp: entry.timestamp,
    }).then(({ error }) => { if (error) console.warn("[db-supabase] insert live_feed:", error); });
  }
  notify();
  return entry;
}

export function supabaseUpdateFeedEntryStatus(feedId: string, status: "Resolved", resolutionNote?: string): LiveFeedEntry | undefined {
  const e = cache.liveFeed.find((x) => x.feedId === feedId);
  if (!e) return undefined;
  e.status = status;
  e.resolvedAt = nowIso();
  if (resolutionNote) e.resolutionNote = resolutionNote;
  if (supabase) {
    supabase.from("live_feed").update({
      status,
      resolved_at: e.resolvedAt,
      resolution_note: resolutionNote ?? null,
    }).eq("feed_id", feedId).then(({ error }) => { if (error) console.warn("[db-supabase] update live_feed:", error); });
  }
  notify();
  return e;
}

export function supabaseUpdateDeliveryStatus(deliveryId: string, status: DeliveryStatus, currentLocation?: string, eta?: string): Delivery | undefined {
  const d = cache.deliveries.find((x) => x.deliveryId === deliveryId);
  if (!d) return undefined;
  d.status = status;
  if (currentLocation) d.currentLocation = currentLocation;
  if (eta) d.eta = eta;
  d.timestamp = nowIso();
  d.history.push({ location: d.currentLocation, status: d.status, timestamp: d.timestamp });
  if (supabase) {
    supabase.from("deliveries").update({
      status,
      current_location: currentLocation ?? d.currentLocation,
      eta: eta ?? d.eta,
      timestamp: d.timestamp,
      history: d.history,
      updated_at: nowIso(),
    }).eq("delivery_id", deliveryId).then(({ error }) => { if (error) console.warn("[db-supabase] update delivery:", error); });
  }
  notify();
  return d;
}

export function supabaseUpdateProductStock(productId: string, quantity: number): Product | undefined {
  const p = cache.products.find((x) => x.productId === productId);
  if (!p) return undefined;
  p.quantityInStock = Math.max(0, quantity);
  p.updatedAt = nowIso();
  if (supabase) {
    supabase.from("products").update({
      quantity_in_stock: p.quantityInStock,
      updated_at: p.updatedAt,
    }).eq("product_id", productId).then(({ error }) => { if (error) console.warn("[db-supabase] update product:", error); });
  }
  notify();
  return p;
}

export function supabaseAddSupplyShift(input: {
  fromSupplierId: string;
  toSupplierId: string;
  productId?: string;
  productName?: string;
  quantity: number;
  feedId?: string;
}): SupplyShift {
  const shift: SupplyShift = {
    shiftId: uid("shift"),
    ...input,
    timestamp: nowIso(),
  };
  cache.supplyShifts.unshift(shift);
  if (cache.supplyShifts.length > 20) cache.supplyShifts.pop();
  if (supabase) {
    supabase.from("supply_shifts").insert({
      shift_id: shift.shiftId,
      from_supplier_id: shift.fromSupplierId,
      to_supplier_id: shift.toSupplierId,
      product_id: input.productId ?? null,
      product_name: input.productName ?? null,
      quantity: shift.quantity,
      timestamp: shift.timestamp,
      feed_id: input.feedId ?? null,
    }).then(({ error }) => { if (error) console.warn("[db-supabase] insert supply_shift:", error); });
  }
  notify();
  return shift;
}
