# Real-Time Request Flow — Retailer → Supplier

This document describes the fully functional real-time request flow with voice and text alerts.

## 1. Retailer Request Submission → Real-Time Supplier Feed

### Flow
1. Retailer submits form (Type, Supplier, Product Name, Category, Quantity, Message).
2. `addRetailerRequest()` pushes to in-memory store, calls `persistRetailerRequests()` (localStorage), then `notify()`.
3. Same tab: subscribers receive `notify()` → `refresh()` → UI updates.
4. Other tabs: `storage` event fires → `loadRetailerRequestsFromStorage()` → `notify()` → UI updates.
5. 2s poll fallback ensures propagation even if storage event is missed.

### Code: Retailer submission

```ts
// src/data/db.ts — addRetailerRequest
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
  const req: RetailerRequest = {
    requestId: uid("req"),
    ...input,
    status: "Pending",
    createdAt: nowIso(),
  };
  retailerRequests.push(req);
  persistRetailerRequests();  // localStorage write
  notify();                  // same-tab listeners
  return req;
}
```

### Code: Cross-tab sync (storage event)

```ts
// src/data/db.ts
window.addEventListener("storage", (e) => {
  if (e.key === RETAILER_REQUESTS_STORAGE_KEY) {
    loadRetailerRequestsFromStorage();
    notify();
  }
});
```

### Code: Supplier page subscribe + poll

```ts
// src/pages/SupplierRequestsPage.tsx
useEffect(() => {
  refresh();
  const unsub = subscribeToUpdates(refresh);
  const fastPoll = setInterval(refresh, 2000);
  const slowPoll = setInterval(refresh, 30000);
  return () => {
    unsub();
    clearInterval(fastPoll);
    clearInterval(slowPoll);
  };
}, [refresh]);
```

---

## 2. Supplier Live Feed — Visual + Voice Alert

### Visual alert
- New requests: orange ring + pulse animation for 8 seconds (`ring-2 ring-orange-400 ring-offset-2 animate-pulse`).
- Pending = orange card, Resolved = green card.

### Voice alert (new request)
Phrase: *"New request received. Product: [X], Category: [Y], Type: [Z], Quantity: [N], Message: [M]"*

```ts
// src/lib/voiceAlerts.ts
export function speakNewRequestWithDetails(
  productName: string, category: string, type: string,
  quantity: string | number, message: string
): void {
  const q = quantity === "" || quantity == null ? "—" : String(quantity);
  speak(`New request received. Product: ${productName}, Category: ${category}, Type: ${type}, Quantity: ${q}, Message: ${message}`);
}
```

```ts
// src/pages/SupplierRequestsPage.tsx — auto-trigger for new Pending requests
useEffect(() => {
  const seen = seenRequestIdsRef.current;
  for (const req of requests) {
    if (req.status !== "Pending" || seen.has(req.requestId)) continue;
    seen.add(req.requestId);
    setNewRequestIds((prev) => new Set(prev).add(req.requestId));
    speakNewRequestWithDetails(productName, category, type, quantity, message);
  }
}, [requests]);
```

---

## 3. Resolve / Dropdown Actions — Updates Both Pages

### Actions
- **Restock Supply** — resolves with "Restock supply initiated…"
- **Delay Acknowledged** — resolves with "Delay acknowledged…"
- **Use AI to Resolve** — AI logic for restock/delay/general
- **Manual Fix** — opens dialog for resolution note

### Code: Resolve updates supplier + retailer

```ts
// src/data/db.ts — resolveRequest
export function resolveRequest(
  requestId: string,
  resolutionNote: string,
  resolvedBy: "ai" | "manual"
): RetailerRequest | undefined {
  const r = retailerRequests.find((x) => x.requestId === requestId);
  if (!r) return undefined;
  r.status = "Resolved";
  r.resolvedAt = nowIso();
  r.resolutionNote = resolutionNote;
  r.resolvedBy = resolvedBy;
  persistRetailerRequests();  // → storage event in retailer tab
  notify();                   // → same-tab refresh
  return r;
}
```

### Code: Voice on resolve

```ts
// src/lib/voiceAlerts.ts
export function speakResolvedForProductAndMessage(
  productName: string, message: string, fromUserClick = false
): void {
  const phrase = `Issue resolved for Product: ${productName}, Message: ${message}, Retailer notified`;
  if (fromUserClick) enableFromUserGesture();
  speak(phrase);
}
```

### Code: Detecting resolved requests + voice alert (automatic)

When a request becomes Resolved (either from this tab or from another tab via storage sync), the supplier page speaks:

```ts
// src/pages/SupplierRequestsPage.tsx — auto voice for resolved
const RESOLVED_RECENT_MS = 120_000; // only speak for resolutions in last 2 min
useEffect(() => {
  const announced = announcedResolvedRef.current;
  for (const req of requests) {
    if (req.status !== "Resolved" || announced.has(req.requestId)) continue;
    announced.add(req.requestId);
    const resolvedAgo = req.resolvedAt ? Date.now() - new Date(req.resolvedAt).getTime() : Infinity;
    if (resolvedAgo > RESOLVED_RECENT_MS) continue;
    speakResolvedForProductAndMessage(productName, message, false);
  }
}, [requests]);
```

To avoid double-speak when supplier resolves in the same tab, add the request ID to `announcedResolvedRef` before calling `resolveRequest()` in each action handler.

### Code: Text alert for resolved requests (Live Event Feed)

When supplier resolves, the Live Event Feed displays:
> "Issue Resolved ✅ — Product: [Product Name], Category: [Category], Type: [Type], Quantity: [Quantity], Message: [Message]"

```tsx
// src/pages/SupplierRequestsPage.tsx — resolved request block
{req.resolutionNote && (
  <div className="bg-emerald-500/15 border border-emerald-500/40 rounded p-2.5">
    <div className="font-medium text-emerald-700">
      <CheckCircle /> Issue Resolved ✅ — Product: {productName}, Category: {category}, Type: {type}, Quantity: {quantity}, Message: {message}
    </div>
    <div>Resolved by {req.resolvedBy} · {req.resolvedAt}</div>
    <div>{req.resolutionNote}</div>
  </div>
)}
```

### Code: Retailer page auto-update

```ts
// src/pages/RetailerDashboardPage.tsx
const unsub = subscribeToUpdates(() => {
  refresh();
  if (retailer) setRequests(getRetailerRequests(retailer.retailerId));
});
const poll = setInterval(() => {
  if (retailer) setRequests(getRetailerRequests(retailer.retailerId));
}, 2000);
```

---

## 4. Database Schema

See `src/data/schema-reference.sql` for full definitions. Key tables:

- **requests** — Request_ID, Retailer_ID, Supplier_ID, Type, Product_Name, Category, Quantity, Message, Timestamp, Status
- **products** — Product_ID, Name, Supplier_ID, Category, Stock_Status
- **suppliers** — Supplier_ID, Name, Contact_Info
- **retailers** — Retailer_ID, Name, Credentials
- **live_feed** — Feed_ID, Error_Type, Supplier_ID, Product_ID, Quantity, Message, Status, Timestamp

Sample entries are in the schema file.

---

## 5. Key Paths

| Component              | Path                                  |
|------------------------|----------------------------------------|
| Data layer (add/resolve, sync) | `src/data/db.ts`              |
| Types                  | `src/data/types.ts`                    |
| Schema + samples       | `src/data/schema-reference.sql`        |
| Retailer dashboard     | `src/pages/RetailerDashboardPage.tsx`  |
| Supplier live feed     | `src/pages/SupplierRequestsPage.tsx`   |
| Voice alerts           | `src/lib/voiceAlerts.ts`               |
