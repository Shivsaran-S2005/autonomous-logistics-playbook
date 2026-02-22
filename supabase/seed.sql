-- ARES Supply Chain - Seed Data
-- Run AFTER 00001_initial_schema.sql (in Supabase SQL Editor)

-- ============ SUPPLIERS ============
INSERT INTO suppliers (supplier_id, name, contact_info, distribution_regions, active_status, location_x, location_y) VALUES
  ('sup_cadbury', 'Cadbury', 'contact@cadbury.com, +91-22-12345678', '["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"]', true, 15, 25),
  ('sup_nestle', 'Nestle', 'supply@nestle.in, +91-44-87654321', '["Chennai", "Mumbai", "Delhi", "Hyderabad"]', true, 50, 20),
  ('sup_ferrero', 'Ferrero', 'india@ferrero.com, +91-80-22334455', '["Bangalore", "Mumbai", "Delhi"]', true, 80, 30),
  ('sup_mars', 'Mars', 'mars.supply@mars.com, +91-11-33445566', '["Delhi", "Mumbai", "Pune"]', true, 25, 70),
  ('sup_hersheys', 'Hershey''s', 'apac@hersheys.com, +91-33-44556677', '["Kolkata", "Mumbai", "Delhi"]', true, 75, 75)
ON CONFLICT (supplier_id) DO NOTHING;

-- ============ RETAILERS ============
INSERT INTO retailers (retailer_id, name, region, email, password_hash, authorized_supplier_ids) VALUES
  ('ret_mumbai_1', 'Mumbai Central Retail', 'Mumbai', 'retailer@mumbai.com', 'retailer123', '["sup_cadbury", "sup_nestle", "sup_ferrero"]'),
  ('ret_delhi_1', 'Delhi North Retail', 'Delhi', 'retailer@delhi.com', 'retailer123', '["sup_cadbury", "sup_mars", "sup_hersheys"]'),
  ('ret_bangalore_1', 'Bangalore South Retail', 'Bangalore', 'retailer@bangalore.com', 'retailer123', '["sup_cadbury", "sup_nestle", "sup_ferrero", "sup_mars"]')
ON CONFLICT (retailer_id) DO NOTHING;

-- ============ PRODUCTS ============
INSERT INTO products (product_id, name, supplier_id, type, category, sku, quantity_in_stock, price_per_unit, expiry_date, distribution_location, delivery_status, description) VALUES
  ('prod_5star', '5 Star', 'sup_cadbury', 'chocolate', 'chocolate', 'CAD-5ST-001', 450, 30, (CURRENT_DATE + 180), 'Mumbai DC', 'in_transit', 'Milk chocolate with caramel and nougat. 45g bar.'),
  ('prod_dairymilk', 'Dairy Milk', 'sup_cadbury', 'chocolate', 'chocolate', 'CAD-DM-002', 620, 50, (CURRENT_DATE + 200), 'Delhi DC', 'delivered', 'Cadbury Dairy Milk 60g. Milk chocolate.'),
  ('prod_perk', 'Perk', 'sup_cadbury', 'wafer', 'wafer', 'CAD-PRK-003', 380, 20, (CURRENT_DATE + 160), 'Bangalore DC', 'pending', 'Chocolate-coated wafer. 27g.'),
  ('prod_gems', 'Gems', 'sup_cadbury', 'confectionery', 'confectionery', 'CAD-GEM-004', 15, 10, (CURRENT_DATE + 90), 'Chennai DC', 'in_transit', 'Colorful candy-coated chocolate buttons. 40g pack.'),
  ('prod_bournville', 'Bournville', 'sup_cadbury', 'chocolate', 'chocolate', 'CAD-BV-005', 280, 80, (CURRENT_DATE + 220), 'Kolkata DC', 'delivered', 'Dark chocolate 80g. Cocoa 50%.'),
  ('prod_kitkat', 'Kit Kat', 'sup_nestle', 'chocolate', 'chocolate', 'NES-KK-001', 520, 25, (CURRENT_DATE + 190), 'Chennai DC', 'in_transit', 'Chocolate-covered wafer fingers. 45g.'),
  ('prod_munch', 'Munch', 'sup_nestle', 'snack', 'snack', 'NES-MUN-002', 340, 15, (CURRENT_DATE + 170), 'Mumbai DC', 'pending', 'Chocolate-coated biscuit. 28g.'),
  ('prod_ferrero', 'Ferrero Rocher', 'sup_ferrero', 'chocolate', 'chocolate', 'FER-FR-001', 120, 250, (CURRENT_DATE + 240), 'Bangalore DC', 'delivered', 'Hazelnut chocolate in gold wrapper. 3 balls 36g.'),
  ('prod_nutella', 'Nutella', 'sup_ferrero', 'chocolate', 'chocolate', 'FER-NUT-002', 200, 450, (CURRENT_DATE + 365), 'Mumbai DC', 'in_transit', 'Hazelnut cocoa spread. 350g jar.'),
  ('prod_snickers', 'Snickers', 'sup_mars', 'chocolate', 'chocolate', 'MAR-SNK-001', 380, 40, (CURRENT_DATE + 200), 'Delhi DC', 'delayed', 'Peanut chocolate bar. 50g.'),
  ('prod_mms', 'M&M''s', 'sup_mars', 'candy', 'candy', 'MAR-MMS-002', 260, 35, (CURRENT_DATE + 180), 'Pune DC', 'in_transit', 'Colorful chocolate candies. 45g pack.'),
  ('prod_hersheys_bar', 'Hershey''s Milk Chocolate', 'sup_hersheys', 'chocolate', 'chocolate', 'HER-MC-001', 180, 60, (CURRENT_DATE + 210), 'Kolkata DC', 'pending', 'Classic milk chocolate bar. 43g.')
ON CONFLICT (product_id) DO UPDATE SET
  quantity_in_stock = EXCLUDED.quantity_in_stock,
  updated_at = now();

-- ============ DELIVERIES ============
INSERT INTO deliveries (delivery_id, product_id, supplier_id, retailer_id, status, current_location, eta, shipment_id, product_batch, remaining_quantity, history) VALUES
  ('del_001', 'prod_5star', 'sup_cadbury', 'ret_mumbai_1', 'in_transit', 'En route to Mumbai (NH48)', (NOW() + INTERVAL '4 hours'), 'SHP-CAD-2024-001', 'BATCH-5ST-Oct24', 1200, '[{"location":"Mumbai DC","status":"pending","timestamp":"2024-01-01T00:00:00Z"},{"location":"En route to Mumbai (NH48)","status":"in_transit","timestamp":"2024-01-01T00:00:00Z"}]'),
  ('del_002', 'prod_dairymilk', 'sup_cadbury', 'ret_delhi_1', 'delivered', 'Delhi North Retail', NOW(), 'SHP-CAD-2024-002', 'BATCH-DM-Oct24', 0, '[{"location":"Delhi DC","status":"pending","timestamp":"2024-01-01T00:00:00Z"},{"location":"Delhi North Retail","status":"delivered","timestamp":"2024-01-01T00:00:00Z"}]'),
  ('del_003', 'prod_snickers', 'sup_mars', 'ret_delhi_1', 'delayed', 'Agra checkpoint', (NOW() + INTERVAL '12 hours'), 'SHP-MAR-2024-003', 'BATCH-SNK-Nov24', 800, '[{"location":"Delhi DC","status":"pending","timestamp":"2024-01-01T00:00:00Z"},{"location":"Agra checkpoint","status":"delayed","timestamp":"2024-01-01T00:00:00Z"}]'),
  ('del_004', 'prod_kitkat', 'sup_nestle', 'ret_bangalore_1', 'in_transit', 'Bengaluru outskirts', (NOW() + INTERVAL '2 hours'), 'SHP-NES-2024-004', 'BATCH-KK-Nov24', 600, '[{"location":"Chennai DC","status":"pending","timestamp":"2024-01-01T00:00:00Z"},{"location":"Bengaluru outskirts","status":"in_transit","timestamp":"2024-01-01T00:00:00Z"}]')
ON CONFLICT (delivery_id) DO NOTHING;

-- ============ LIVE FEED (sample) ============
INSERT INTO live_feed (feed_id, error_type, supplier_id, product_id, product_name, category, quantity, message, ai_suggestion, status) VALUES
  ('feed_sample_1', 'stock_shortage', 'sup_cadbury', 'prod_gems', 'Gems', 'confectionery', 50, 'Low stock detected. Gems below reorder level.', 'Reroute to Nestle or Ferrero for same category.', 'Active')
ON CONFLICT (feed_id) DO NOTHING;
