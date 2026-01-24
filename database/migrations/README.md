# Database Migrations

Place migration files here with timestamp prefix.

## Naming Convention

```
YYYYMMDD_description.sql
```

Examples:
- `20260124_initial_schema.sql`
- `20260130_add_product_image_column.sql`
- `20260205_create_delivery_tracking_table.sql`

## Migration Template

```sql
-- Migration: Description
-- Date: YYYY-MM-DD
-- Author: Your Name

-- ============================================
-- UP Migration
-- ============================================

-- Add your schema changes here


-- ============================================
-- DOWN Migration (for rollback)
-- ============================================

-- Rollback commands (commented out)
-- DROP TABLE IF EXISTS ...
-- ALTER TABLE ... DROP COLUMN ...
```

## Running Migrations

### Manually (Supabase Dashboard)
1. Go to SQL Editor
2. Paste migration content
3. Run

### Using Supabase CLI
```bash
supabase migration new description
supabase db push
```
