-- Supply chain workflow: schema reference and example queries
-- The app uses in-memory data (src/data/db.ts); these SQL snippets match the logical schema.

-- ============ REQUESTS TABLE ============
-- Request_ID, Retailer_ID, Supplier_ID, Type, Product_Name, Category, Quantity, Message, Timestamp, Status
CREATE TABLE IF NOT EXISTS requests (
  request_id    TEXT PRIMARY KEY,
  retailer_id   TEXT NOT NULL,
  supplier_id   TEXT,
  product_id    TEXT,
  product_name  TEXT,
  category      TEXT,
  quantity      INTEGER,
  type          TEXT NOT NULL,
  message       TEXT NOT NULL,
  status        TEXT NOT NULL,  -- 'Pending' | 'Resolved'
  created_at    TEXT NOT NULL,
  resolved_at   TEXT,
  resolution_note TEXT,
  resolved_by   TEXT
);

-- ============ PRODUCTS TABLE ============
-- Product_ID, Name, Supplier_ID, Category, Stock_Status
CREATE TABLE IF NOT EXISTS products (
  product_id     TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  supplier_id   TEXT NOT NULL,
  category      TEXT NOT NULL,
  quantity      INTEGER NOT NULL,
  stock_status  TEXT,
  -- extended: sku, type, price_per_unit, expiry_date, etc.
);

-- ============ RETAILERS TABLE ============
-- Retailer_ID, Name, Credentials
CREATE TABLE IF NOT EXISTS retailers (
  retailer_id   TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  credentials   TEXT,           -- e.g. email + password hash
  region        TEXT,
  authorized_supplier_ids TEXT  -- JSON array or separate table
);

-- ============ SUPPLIERS TABLE ============
-- Supplier_ID, Name, Contact_Info, Location_Coordinates (for live map)
CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id   TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  contact_info  TEXT,
  location_x    REAL,
  location_y    REAL
);

-- ============ LIVE FEED TABLE ============
-- Feed_ID, Error_Type, Supplier_ID, Product_ID, Quantity, Message, Status, Timestamp
CREATE TABLE IF NOT EXISTS live_feed (
  feed_id       TEXT PRIMARY KEY,
  error_type    TEXT NOT NULL,  -- stock_shortage | transport_delay | manual_error | ai_detected | other
  supplier_id   TEXT NOT NULL,
  product_id    TEXT,
  product_name  TEXT,
  category      TEXT,
  quantity      INTEGER,
  message       TEXT NOT NULL,
  ai_suggestion TEXT,
  status        TEXT NOT NULL,  -- 'Active' | 'Resolved'
  timestamp     TEXT NOT NULL,
  resolved_at   TEXT,
  resolution_note TEXT
);

-- ============ SUPPLY SHIFTS (for map flow animation) ============
CREATE TABLE IF NOT EXISTS supply_shifts (
  shift_id          TEXT PRIMARY KEY,
  from_supplier_id  TEXT NOT NULL,
  to_supplier_id    TEXT NOT NULL,
  product_id        TEXT,
  product_name     TEXT,
  quantity          INTEGER NOT NULL,
  timestamp         TEXT NOT NULL,
  feed_id           TEXT
);

-- ============ EXAMPLE QUERIES ============

-- All pending retailer requests for supplier live feed
-- SELECT r.*, p.name AS product_name, ret.name AS retailer_name
-- FROM requests r
-- LEFT JOIN products p ON r.product_id = p.product_id
-- LEFT JOIN retailers ret ON r.retailer_id = ret.retailer_id
-- WHERE r.status = 'Pending'
-- ORDER BY r.created_at DESC;

-- Get requests by retailer (retailer dashboard)
-- SELECT * FROM requests WHERE retailer_id = ? ORDER BY created_at DESC;

-- Resolve a request (supplier action)
-- UPDATE requests
-- SET status = 'Resolved', resolved_at = datetime('now'), resolution_note = ?, resolved_by = ?
-- WHERE request_id = ?;

-- Insert new retailer request
-- INSERT INTO requests (request_id, retailer_id, supplier_id, product_id, quantity, request_type, message, status, created_at)
-- VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', datetime('now'));

-- Products by supplier
-- SELECT * FROM products WHERE supplier_id = ?;

-- ============ SAMPLE ENTRIES (for reference) ============
-- INSERT INTO suppliers (supplier_id, name, contact_info) VALUES
--   ('sup_cadbury', 'Cadbury', 'contact@cadbury.com'),
--   ('sup_nestle', 'Nestle', 'supply@nestle.in');
-- INSERT INTO products (product_id, name, supplier_id, category, quantity, stock_status) VALUES
--   ('prod_5star', '5 Star', 'sup_cadbury', 'chocolate', 450, 'in_stock'),
--   ('prod_dairymilk', 'Dairy Milk', 'sup_cadbury', 'chocolate', 620, 'in_stock');
-- INSERT INTO retailers (retailer_id, name, credentials) VALUES
--   ('ret_mumbai_1', 'Mumbai Central Retail', 'email:retailer@mumbai.com');
-- INSERT INTO requests (request_id, retailer_id, supplier_id, type, product_name, category, quantity, message, status, created_at) VALUES
--   ('req_1', 'ret_mumbai_1', 'sup_cadbury', 'restock', 'Dairy Milk', 'chocolate', 100, 'Need urgent restock', 'Pending', datetime('now'));

-- Live feed errors (for map + feed UI)
-- SELECT * FROM live_feed WHERE status = 'Active' ORDER BY timestamp DESC;
-- Suppliers with active errors (for map red points)
-- SELECT DISTINCT supplier_id FROM live_feed WHERE status = 'Active';
-- Recent supply shifts (for flow animation)
-- SELECT * FROM supply_shifts ORDER BY timestamp DESC LIMIT 10;
