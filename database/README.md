# Database

This folder contains database-related files for MirSklada IMS.

## Files

- `schema.sql` - Complete database schema with tables, indexes, and RLS policies
- `seed.sql` - Sample data for development and testing
- `migrations/` - Database migration files (for incremental changes)

## Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant business accounts |
| `users` | System users with roles |
| `categories` | Product categories |
| `units` | Units of measurement (kg, piece, box, etc.) |
| `products` | Product catalog |
| `product_units` | Multiple units per product with conversion factors |

### Supplier Management

| Table | Purpose |
|-------|---------|
| `suppliers` | Supplier contacts and debt |
| `purchases` | Incoming stock records |
| `purchase_items` | Items in each purchase |
| `supplier_payments` | Payments to suppliers |

### Client Management

| Table | Purpose |
|-------|---------|
| `clients` | Customer contacts and debt |
| `client_prices` | Custom pricing per client |
| `orders` | Sales orders |
| `order_items` | Items in each order |
| `client_payments` | Payments from clients |

### Audit

| Table | Purpose |
|-------|---------|
| `stock_movements` | Complete audit trail of all stock changes |

## Setting Up

### Local PostgreSQL

```bash
# Create database
createdb mirsklada

# Run schema
psql -d mirsklada -f schema.sql

# Run seed data (development only)
psql -d mirsklada -f seed.sql
```

### Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Run `schema.sql` to create tables
3. Run `seed.sql` for sample data (development only)
4. Configure Row Level Security policies in Authentication → Policies

## Migrations

When making schema changes:

1. Create a new file in `migrations/` with timestamp prefix
2. Example: `migrations/20260124_add_product_image.sql`
3. Document the change in the migration file
4. Run migration on all environments

## Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:
- Users can only access data from their organization
- Data isolation between tenants is enforced at database level

Configure policies in Supabase Dashboard or via SQL.
