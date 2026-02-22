-- ARES Supply Chain - Full Database Schema
-- Run this in Supabase SQL Editor or via: supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ SUPPLIERS ============
CREATE TABLE suppliers (
  supplier_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info TEXT,
  distribution_regions JSONB DEFAULT '[]',
  active_status BOOLEAN DEFAULT true,
  location_x REAL,
  location_y REAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ RETAILERS ============
CREATE TABLE retailers (
  retailer_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  authorized_supplier_ids JSONB DEFAULT '[]',
  authorized_product_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ PRODUCTS ============
CREATE TABLE products (
  product_id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  price_per_unit REAL NOT NULL DEFAULT 0,
  expiry_date DATE,
  distribution_location TEXT,
  delivery_status TEXT DEFAULT 'pending',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ DELIVERIES ============
CREATE TABLE deliveries (
  delivery_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  retailer_id TEXT NOT NULL REFERENCES retailers(retailer_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  current_location TEXT,
  eta TIMESTAMPTZ,
  timestamp TIMESTAMPTZ DEFAULT now(),
  shipment_id TEXT,
  product_batch TEXT,
  remaining_quantity INTEGER,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ RETAILER REQUESTS ============
CREATE TABLE retailer_requests (
  request_id TEXT PRIMARY KEY,
  retailer_id TEXT NOT NULL REFERENCES retailers(retailer_id) ON DELETE CASCADE,
  supplier_id TEXT REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
  product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
  product_name TEXT,
  category TEXT,
  quantity INTEGER,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  resolved_by TEXT
);

-- ============ LIVE FEED (errors for map + feed) ============
CREATE TABLE live_feed (
  feed_id TEXT PRIMARY KEY,
  error_type TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
  product_name TEXT,
  category TEXT,
  quantity INTEGER,
  message TEXT NOT NULL,
  ai_suggestion TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

-- ============ SUPPLY SHIFTS ============
CREATE TABLE supply_shifts (
  shift_id TEXT PRIMARY KEY,
  from_supplier_id TEXT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  to_supplier_id TEXT NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
  product_name TEXT,
  quantity INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  feed_id TEXT
);

-- ============ ACTION LOGS ============
CREATE TABLE action_logs (
  action_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT,
  delivery_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_type TEXT NOT NULL,
  details TEXT
);

-- ============ GOVERNANCE LOG ============
CREATE TABLE governance_log (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL,
  user_id TEXT,
  details TEXT NOT NULL,
  ref_id TEXT
);

-- ============ ARES SIMULATION STATE (optional persistence) ============
CREATE TABLE ares_world_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_retailer_requests_retailer ON retailer_requests(retailer_id);
CREATE INDEX idx_retailer_requests_status ON retailer_requests(status);
CREATE INDEX idx_retailer_requests_created ON retailer_requests(created_at DESC);
CREATE INDEX idx_deliveries_retailer ON deliveries(retailer_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_live_feed_status ON live_feed(status);
CREATE INDEX idx_live_feed_timestamp ON live_feed(timestamp DESC);
CREATE INDEX idx_governance_timestamp ON governance_log(timestamp DESC);

-- Row Level Security (RLS) - enable for auth; allow anon for demo
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ares_world_state ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo (replace with proper policies for production)
CREATE POLICY "Allow all for anon" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON retailers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON deliveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON retailer_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON live_feed FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON supply_shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON action_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON governance_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON ares_world_state FOR ALL USING (true) WITH CHECK (true);
