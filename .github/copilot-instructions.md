# Mirsklada - GitHub Copilot Instructions

> Multi-tenant SaaS Inventory Management System for Uzbekistan's Wholesale Food Market

## Project Overview

**mirsklada** is a weight-based inventory management system designed for wholesale food businesses (fish, meat, cheese) in Uzbekistan. It features multi-tenancy with strict data isolation and local payment gateway integrations.

## Tech Stack

| Layer      | Technology                                         |
| ---------- | -------------------------------------------------- |
| Runtime    | Node.js v20 LTS, TypeScript (strict)               |
| Backend    | Express.js                                         |
| Frontend   | React 18 + Vite + Tailwind CSS (Dark Mode default) |
| Database   | PostgreSQL 15+ with Row-Level Security (RLS)       |
| ORM        | Prisma                                             |
| Auth       | Supabase Auth or Clerk                             |
| Validation | Zod (shared between FE/BE)                         |
| i18n       | i18next (EN, RU, UZ)                               |
| Monorepo   | Turborepo                                          |
| Testing    | Vitest (unit) + Supertest (integration)            |

## Architecture

```
apps/
├── api/          # Express backend
├── web/          # React frontend

packages/
├── shared/       # Shared types, Zod schemas, utilities
├── database/     # Prisma client
└── ui/           # Shared UI components
```

## Critical Business Rules

### Multi-Tenancy

- **EVERY database table** must have a `tenant_id` column (except system tables)
- All queries MUST filter by `tenant_id` from the authenticated user
- Use PostgreSQL Row-Level Security (RLS) as a safety net
- Never trust client-provided `tenant_id`

### Weight-Based Calculations

- All weights are stored as `DECIMAL(10,2)` in **kilograms**
- Always round to 2 decimal places: `Math.round(value * 100) / 100`
- Display format: `12.50 kg` (always show 2 decimals)

### Currency

- Primary currency: UZS (Uzbek Som)
- Format with thousand separators: `1 000 000 UZS`
- Store as integers (tiyin) to avoid floating point issues

## Code Conventions

### File Naming

- Files: `kebab-case.ts` (e.g., `product-service.ts`)
- React components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Test files: `*.test.ts` or `*.spec.ts`

### Naming Conventions

- Classes/Interfaces: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Database tables: `snake_case`
- Database columns: `snake_case`
- Environment variables: `SCREAMING_SNAKE_CASE`

### TypeScript

- Always use `strict: true`
- Prefer `interface` over `type` for object shapes
- Export types from `@mirsklada/shared`
- Never use `any` - use `unknown` and narrow types

### Imports Order

```typescript
// 1. Node.js built-ins
import { readFile } from "fs/promises";

// 2. External packages
import express from "express";
import { z } from "zod";

// 3. Internal packages (@mirsklada/*)
import { ProductSchema } from "@mirsklada/shared";

// 4. Relative imports
import { productService } from "./product-service";
```

## Error Handling

Always use the custom `AppError` class:

```typescript
import { AppError } from "@/utils/app-error";

// Usage
throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
```

## i18n Requirements

- **Never hardcode user-facing strings**
- Always use translation keys
- Support: English (en), Russian (ru), Uzbek (uz)

```typescript
// ❌ Bad
return res.json({ message: "Product created successfully" });

// ✅ Good
return res.json({ message: t("product.created") });
```

## Security Checklist

- [ ] Validate all inputs with Zod
- [ ] Always check `tenant_id` in queries
- [ ] Sanitize data before database operations
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Encrypt sensitive data (OAuth tokens)
- [ ] Never log sensitive information

## Testing Requirements

- Unit tests for all utility functions
- Integration tests for API endpoints
- Test multi-tenancy isolation
- Test weight calculation edge cases

## Environment Variables

Required variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` - Auth
- `ENCRYPTION_KEY` - 32-byte key for token encryption
