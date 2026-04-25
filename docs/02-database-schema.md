# Mirsklada Database Schema

> Reference this document when working on database models or queries.

## Entity Relationship Overview

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Tenant     │──────<│    User      │       │ Subscription │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                     │
       │                      │                     │
       ▼                      ▼                     │
┌──────────────┐       ┌──────────────┐             │
│  Category    │──────<│   Product    │             │
└──────────────┘       └──────────────┘             │
                              │                     │
                              ▼                     │
                       ┌──────────────┐             │
                       │StockMovement │             │
                       └──────────────┘             │
                                                    │
┌──────────────┐       ┌──────────────┐             │
│ PriceMatrix  │──────<│   Client     │<────────────┘
└──────────────┘       └──────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│PriceMatrixItem│      │    Order     │
└──────────────┘       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  OrderItem   │
                       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐       ┌──────────────┐
                       │  DebtLedger  │<──────│   Payment    │
                       └──────────────┘       └──────────────┘

## Core Tables

### Tenants & Users

```sql
-- Business/Organization
tenants (
  id              UUID PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  subscription_tier  VARCHAR(20) DEFAULT 'basic', -- 'basic' | 'pro'
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP
)

-- Users (managed by Supabase Auth)
users (
  id              UUID PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW()
)

-- User-Tenant membership (RBAC)
tenant_members (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id),
  user_id         UUID REFERENCES users(id),
  role            VARCHAR(20) NOT NULL, -- 'admin' | 'staff'
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
)
```

### Inventory

```sql
-- Product categories
categories (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP
)

-- Products
products (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  category_id     UUID REFERENCES categories(id),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  unit            VARCHAR(20) DEFAULT 'kg',
  base_price_per_kg  DECIMAL(12,2) NOT NULL,
  current_stock_kg   DECIMAL(10,2) DEFAULT 0,
  min_stock_kg    DECIMAL(10,2) DEFAULT 0, -- Low stock alert threshold
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP
)

-- Stock movements (audit trail)
stock_movements (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  product_id      UUID REFERENCES products(id) NOT NULL,
  type            VARCHAR(10) NOT NULL, -- 'IN' | 'OUT' | 'ADJUST'
  quantity_kg     DECIMAL(10,2) NOT NULL,
  reference_type  VARCHAR(50), -- 'purchase' | 'order' | 'adjustment'
  reference_id    UUID, -- order_id or purchase_id
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
)
```

### Clients & Pricing

```sql
-- Client businesses (pizzerias, restaurants, etc.)
clients (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  contact_person  VARCHAR(255),
  phone           VARCHAR(50),
  address         TEXT,
  price_matrix_id UUID REFERENCES price_matrices(id),
  debt_balance    DECIMAL(14,2) DEFAULT 0, -- Cached balance
  notes           TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP
)

-- Custom pricing tiers
price_matrices (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  name            VARCHAR(255) NOT NULL, -- e.g., "VIP Clients", "Retail"
  description     TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP
)

-- Product prices per matrix
price_matrix_items (
  id              UUID PRIMARY KEY,
  price_matrix_id UUID REFERENCES price_matrices(id) NOT NULL,
  product_id      UUID REFERENCES products(id) NOT NULL,
  custom_price_kg DECIMAL(12,2) NOT NULL,
  UNIQUE(price_matrix_id, product_id)
)
```

### Orders & Payments

```sql
-- Orders
orders (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  client_id       UUID REFERENCES clients(id) NOT NULL,
  order_number    VARCHAR(50), -- Human-readable number
  status          VARCHAR(20) DEFAULT 'pending',
                  -- 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled'
  total_amount    DECIMAL(14,2) NOT NULL,
  notes           TEXT,
  delivery_address TEXT,
  delivery_date   DATE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP,
  delivered_at    TIMESTAMP
)

-- Order line items
order_items (
  id              UUID PRIMARY KEY,
  order_id        UUID REFERENCES orders(id) NOT NULL,
  product_id      UUID REFERENCES products(id) NOT NULL,
  product_name    VARCHAR(255) NOT NULL, -- Snapshot at order time
  quantity_kg     DECIMAL(10,2) NOT NULL,
  price_per_kg    DECIMAL(12,2) NOT NULL, -- Price at order time
  line_total      DECIMAL(14,2) NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Payments received
payments (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  client_id       UUID REFERENCES clients(id) NOT NULL,
  amount          DECIMAL(14,2) NOT NULL,
  method          VARCHAR(50), -- 'cash' | 'card' | 'transfer' | 'click' | 'payme'
  reference       VARCHAR(255), -- Transaction ID from payment gateway
  notes           TEXT,
  received_by     UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Debt ledger (double-entry for accuracy)
debt_ledger (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  client_id       UUID REFERENCES clients(id) NOT NULL,
  type            VARCHAR(10) NOT NULL, -- 'DEBIT' (owes more) | 'CREDIT' (paid)
  amount          DECIMAL(14,2) NOT NULL,
  order_id        UUID REFERENCES orders(id),
  payment_id      UUID REFERENCES payments(id),
  description     TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
)
```

### Integrations

```sql
-- Encrypted OAuth tokens (Google Drive, etc.)
tenant_secrets (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  provider        VARCHAR(50) NOT NULL, -- 'google_drive' | 'yandex'
  encrypted_token TEXT NOT NULL, -- AES-256-GCM encrypted
  iv              TEXT NOT NULL, -- Initialization vector
  metadata        JSONB, -- Additional provider-specific data
  expires_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP,
  UNIQUE(tenant_id, provider)
)

-- Google Drive file references
drive_files (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  drive_file_id   VARCHAR(255) NOT NULL,
  filename        VARCHAR(255) NOT NULL,
  purpose         VARCHAR(50), -- 'warehouse_photo' | 'invoice' | 'report'
  mime_type       VARCHAR(100),
  uploaded_by     UUID REFERENCES users(id),
  uploaded_at     TIMESTAMP DEFAULT NOW()
)

-- Subscription billing
subscriptions (
  id              UUID PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id) NOT NULL,
  tier            VARCHAR(20) NOT NULL, -- 'basic' | 'pro'
  provider        VARCHAR(50) NOT NULL, -- 'dodo' | 'click' | 'payme'
  external_id     VARCHAR(255), -- Provider's subscription ID
  status          VARCHAR(20) DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end   TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP
)
```

## Key Indexes

```sql
-- Multi-tenancy indexes (critical for performance)
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_debt_ledger_client ON debt_ledger(client_id);

-- Search indexes
CREATE INDEX idx_products_name ON products(tenant_id, name);
CREATE INDEX idx_clients_name ON clients(tenant_id, name);
CREATE INDEX idx_clients_phone ON clients(tenant_id, phone);
```

## Row-Level Security (RLS)

```sql
-- Enable RLS on all tenant tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables

-- Policy: Users can only access their tenant's data
CREATE POLICY tenant_isolation ON products
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

## Weight & Currency Rules

| Field Type   | PostgreSQL Type | Example          |
| ------------ | --------------- | ---------------- |
| Weight       | `DECIMAL(10,2)` | `12.50` kg       |
| Price per kg | `DECIMAL(12,2)` | `45000.00` UZS   |
| Order total  | `DECIMAL(14,2)` | `1250000.00` UZS |
| Debt balance | `DECIMAL(14,2)` | `5000000.00` UZS |
