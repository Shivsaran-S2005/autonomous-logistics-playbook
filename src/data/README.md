# Multi-Supplier Supply Chain — Database & API

## Database Structure (in-memory)

### Suppliers Table
| Column | Type | Description |
|--------|------|-------------|
| supplierId | string | PK |
| name | string | Supplier Name |
| contactInfo | string | Contact Info |
| distributionRegions | string[] | Distribution Regions |
| activeStatus | boolean | Active Status |

**Seed suppliers:** Cadbury, Nestle, Ferrero, Mars, Hershey's.

### Products Table
| Column | Type | Description |
|--------|------|-------------|
| productId | string | PK |
| name | string | Product Name |
| supplierId | string | FK → Suppliers |
| type | string | chocolate, candy, snack, wafer, biscuit, confectionery |
| sku | string | SKU/ID |
| quantityInStock | number | Quantity in Stock |
| pricePerUnit | number | Price per Unit |
| expiryDate | string | ISO date |
| distributionLocation | string | City/region |
| deliveryStatus | string | pending, in_transit, delivered, delayed, cancelled |
| description | string | Ingredients, packaging, weight, size |
| updatedAt | string | ISO datetime |

### Deliveries Table (live tracking)
| Column | Type | Description |
|--------|------|-------------|
| deliveryId | string | PK |
| productId | string | FK → Products |
| supplierId | string | FK → Suppliers |
| retailerId | string | FK → Retailers |
| status | string | DeliveryStatus |
| currentLocation | string | Current location |
| eta | string | ISO datetime |
| timestamp | string | Last update |
| shipmentId | string | Optional |
| productBatch | string | Optional |
| remainingQuantity | number | Optional |
| history | DeliveryHistoryEntry[] | Delivery history |

### Retailers Table
| Column | Type | Description |
|--------|------|-------------|
| retailerId | string | PK |
| name | string | Name |
| region | string | Region |
| email | string | Login email |
| passwordHash | string | Demo: plain password |
| authorizedSupplierIds | string[] | Suppliers retailer can see |
| authorizedProductIds | string[] | Empty = all from authorized suppliers |

### Logs Table
| Column | Type | Description |
|--------|------|-------------|
| actionId | string | PK |
| userId | string | retailerId or "consumer" |
| productId | string | Optional |
| deliveryId | string | Optional |
| timestamp | string | ISO |
| actionType | string | viewed, updated, delivered, created, login |
| details | string | Optional |

---

## Sample Queries (from `db.ts`)

### Add new supplier
```ts
import { addSupplier } from "@/data/db";
addSupplier({
  name: "New Co",
  contactInfo: "contact@newco.com",
  distributionRegions: ["Mumbai", "Delhi"],
  activeStatus: true,
});
```

### Add new product
```ts
import { addProduct } from "@/data/db";
addProduct({
  name: "New Bar",
  supplierId: "sup_cadbury",
  type: "chocolate",
  sku: "CAD-NB-001",
  quantityInStock: 100,
  pricePerUnit: 40,
  expiryDate: "2026-12-31",
  distributionLocation: "Mumbai DC",
  deliveryStatus: "pending",
  description: "Milk chocolate 50g.",
});
```

### Update product stock / price / expiry
```ts
import { updateProductStock, updateProduct } from "@/data/db";
updateProductStock("prod_5star", 500);
updateProduct("prod_5star", { pricePerUnit: 35, expiryDate: "2026-06-30" });
```

### Log delivery & update status (live feed)
```ts
import { updateDeliveryStatus } from "@/data/db";
updateDeliveryStatus("del_001", "in_transit", "New location", "2025-02-22T14:00:00.000Z");
```

### Get real-time delivery status
```ts
import { getConsumerDeliveryViews, getRetailerDeliveryViews } from "@/data/db";
const consumerStatus = getConsumerDeliveryViews();  // high-level
const retailerStatus = getRetailerDeliveryViews("ret_mumbai_1");  // detailed
```

### Analytics reports
```ts
import {
  getDeliveriesPerRegion,
  getStockLevelsReport,
  getSupplierPerformanceReport,
} from "@/data/db";
const byRegion = getDeliveriesPerRegion();
const stockLevels = getStockLevelsReport();
const supplierPerf = getSupplierPerformanceReport();
```

### Search & filter products
```ts
import { getProducts, searchProducts } from "@/data/db";
const all = getProducts();
const bySupplier = getProducts({ supplierId: "sup_cadbury" });
const inStock = getProducts({ inStockOnly: true });
const search = searchProducts("Dairy");
```

---

## Live feed updates

- Subscribe to DB changes: `subscribeToUpdates(callback)`. Callback is invoked when data changes.
- UI polls every **45 seconds** (configurable in `LiveDeliveryFeed.tsx` `REFRESH_INTERVAL_MS`).
- Consumer view: high-level status (e.g. "Product in transit to City X").
- Retailer view: shipment ID, batch, current location, ETA, remaining quantity, history.

---

## Role-based access

- **Consumer:** `/consumer` — product catalog, search/filter by supplier and category, high-level delivery feed.
- **Retailer:** `/login` → sign in with retailer email/password → `/retailer` — tracking, alerts for delayed shipments, search/filter by product/supplier/date, chatbot, export reports (deliveries, stock, supplier performance).

Demo retailer credentials: `retailer@mumbai.com`, `retailer@delhi.com`, `retailer@bangalore.com` — password: `retailer123`.
