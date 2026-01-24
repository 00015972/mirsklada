-- ============================================
-- MirSklada Seed Data
-- Sample data for development and testing
-- ============================================

-- ============================================
-- 1. CREATE SAMPLE ORGANIZATION
-- ============================================
INSERT INTO organizations (id, name, phone, address, subscription_tier)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Demo Wholesale Business',
    '+998901234567',
    'Tashkent, Uzbekistan',
    'premium'
);

-- ============================================
-- 2. CREATE DEFAULT UNITS
-- ============================================
INSERT INTO units (id, organization_id, name, abbreviation) VALUES
    ('u0000001-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kilogram', 'kg'),
    ('u0000001-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gram', 'g'),
    ('u0000001-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Piece', 'pc'),
    ('u0000001-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Box', 'box'),
    ('u0000001-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bag', 'bag'),
    ('u0000001-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Litre', 'L'),
    ('u0000001-0000-0000-0000-000000000007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bottle', 'btl');

-- ============================================
-- 3. CREATE SAMPLE CATEGORIES
-- ============================================
INSERT INTO categories (id, organization_id, name, description) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Grains & Rice', 'Rice, wheat, and other grains'),
    ('c0000001-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Oils & Fats', 'Cooking oils and fats'),
    ('c0000001-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dairy Products', 'Milk, cheese, butter'),
    ('c0000001-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Beverages', 'Water, juices, soft drinks'),
    ('c0000001-0000-0000-0000-000000000005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Canned Goods', 'Canned vegetables, fruits, fish'),
    ('c0000001-0000-0000-0000-000000000006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Spices & Condiments', 'Spices, sauces, condiments');

-- ============================================
-- 4. CREATE SAMPLE PRODUCTS
-- ============================================

-- Rice (sold in kg and bags)
INSERT INTO products (id, organization_id, category_id, name, description, barcode, base_unit_id, purchase_price, selling_price, stock_quantity, low_stock_threshold)
VALUES (
    'p0000001-0000-0000-0000-000000000001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0000001-0000-0000-0000-000000000001',
    'Basmati Rice Premium',
    'Premium quality basmati rice',
    '8901234567890',
    'u0000001-0000-0000-0000-000000000001', -- base unit: kg
    12000.00, -- purchase price per kg
    15000.00, -- selling price per kg
    500.00, -- 500 kg in stock
    50.00 -- alert when below 50 kg
);

-- Add product unit: 25kg bag
INSERT INTO product_units (product_id, unit_id, conversion_factor, selling_price)
VALUES (
    'p0000001-0000-0000-0000-000000000001',
    'u0000001-0000-0000-0000-000000000005', -- bag
    25.00, -- 1 bag = 25 kg
    360000.00 -- special price for bag (25kg * 14400 = 360000, slightly discounted)
);

-- Sunflower Oil (sold in litres and boxes)
INSERT INTO products (id, organization_id, category_id, name, description, barcode, base_unit_id, purchase_price, selling_price, stock_quantity, low_stock_threshold)
VALUES (
    'p0000001-0000-0000-0000-000000000002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0000001-0000-0000-0000-000000000002',
    'Sunflower Oil Golden',
    '1L bottle sunflower oil',
    '8901234567891',
    'u0000001-0000-0000-0000-000000000007', -- base unit: bottle
    18000.00, -- purchase price per bottle
    22000.00, -- selling price per bottle
    200.00, -- 200 bottles in stock
    20.00
);

-- Add product unit: box of 12 bottles
INSERT INTO product_units (product_id, unit_id, conversion_factor, selling_price)
VALUES (
    'p0000001-0000-0000-0000-000000000002',
    'u0000001-0000-0000-0000-000000000004', -- box
    12.00, -- 1 box = 12 bottles
    250000.00 -- box price
);

-- Sugar (sold in kg and bags)
INSERT INTO products (id, organization_id, category_id, name, description, barcode, base_unit_id, purchase_price, selling_price, stock_quantity, low_stock_threshold)
VALUES (
    'p0000001-0000-0000-0000-000000000003',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0000001-0000-0000-0000-000000000001',
    'White Sugar',
    'Refined white sugar',
    '8901234567892',
    'u0000001-0000-0000-0000-000000000001', -- kg
    9000.00,
    11000.00,
    300.00,
    30.00
);

-- Add 50kg bag unit
INSERT INTO product_units (product_id, unit_id, conversion_factor, selling_price)
VALUES (
    'p0000001-0000-0000-0000-000000000003',
    'u0000001-0000-0000-0000-000000000005',
    50.00,
    520000.00
);

-- Flour (sold in kg and bags)
INSERT INTO products (id, organization_id, category_id, name, description, barcode, base_unit_id, purchase_price, selling_price, stock_quantity, low_stock_threshold)
VALUES (
    'p0000001-0000-0000-0000-000000000004',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0000001-0000-0000-0000-000000000001',
    'Wheat Flour First Grade',
    'Premium wheat flour for baking',
    '8901234567893',
    'u0000001-0000-0000-0000-000000000001', -- kg
    6000.00,
    8000.00,
    400.00,
    50.00
);

-- Tomato Paste (sold by piece/can)
INSERT INTO products (id, organization_id, category_id, name, description, barcode, base_unit_id, purchase_price, selling_price, stock_quantity, low_stock_threshold)
VALUES (
    'p0000001-0000-0000-0000-000000000005',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c0000001-0000-0000-0000-000000000005',
    'Tomato Paste 400g',
    '400g can tomato paste',
    '8901234567894',
    'u0000001-0000-0000-0000-000000000003', -- piece/can
    8000.00,
    10000.00,
    150.00,
    15.00
);

-- ============================================
-- 5. CREATE SAMPLE SUPPLIERS
-- ============================================
INSERT INTO suppliers (id, organization_id, name, phone, address, notes, total_debt) VALUES
    ('s0000001-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rice Importers Co.', '+998901111111', 'Tashkent, Chilanzar', 'Main rice supplier', 5000000.00),
    ('s0000001-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Golden Oil LLC', '+998902222222', 'Tashkent, Sergeli', 'Cooking oil supplier', 0.00),
    ('s0000001-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sugar & Flour Wholesale', '+998903333333', 'Samarkand', 'Sugar and flour supplier', 2500000.00);

-- ============================================
-- 6. CREATE SAMPLE CLIENTS
-- ============================================
INSERT INTO clients (id, organization_id, name, phone, address, notes, total_debt, telegram_chat_id) VALUES
    ('cl000001-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bella Italia Restaurant', '+998904444444', 'Tashkent, Mirzo Ulugbek', 'Italian restaurant, orders weekly', 1500000.00, NULL),
    ('cl000001-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pizza House', '+998905555555', 'Tashkent, Yunusabad', 'Pizza chain, bulk orders', 0.00, NULL),
    ('cl000001-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mini Market Tashkent', '+998906666666', 'Tashkent, Mirabad', 'Small grocery store', 750000.00, NULL),
    ('cl000001-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Central Cafe', '+998907777777', 'Tashkent, Amir Temur', 'Cafe and bakery', 0.00, NULL);

-- ============================================
-- 7. CREATE CLIENT-SPECIFIC PRICES
-- ============================================

-- Bella Italia gets special price on rice (14000 instead of 15000)
INSERT INTO client_prices (client_id, product_id, unit_id, custom_price) VALUES
    ('cl000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 14000.00);

-- Pizza House gets special price on flour (7500 instead of 8000)
INSERT INTO client_prices (client_id, product_id, unit_id, custom_price) VALUES
    ('cl000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000001', 7500.00);

-- ============================================
-- 8. CREATE SAMPLE USERS (requires Supabase Auth setup)
-- ============================================
-- Note: auth_id should be set after creating users in Supabase Auth
INSERT INTO users (id, organization_id, email, full_name, phone, role) VALUES
    ('us000001-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'owner@demo.com', 'Demo Owner', '+998901234567', 'owner'),
    ('us000001-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'manager@demo.com', 'Demo Manager', '+998901234568', 'warehouse_manager'),
    ('us000001-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sales@demo.com', 'Demo Salesperson', '+998901234569', 'salesperson');

-- ============================================
-- DONE! Sample data inserted successfully
-- ============================================
