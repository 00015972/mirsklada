# Mirsklada Architecture

> Reference this document when working on system-level decisions or integrations.

## System Overview

┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   React Web App │  Web Dashboard  │  Client Browser             │
│   (Tailwind/i18n)│  (Admin Portal) │  (Responsive UI)            │
└────────┬────────┴────────┬────────┴─────────────┬───────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION TIER                          │
│                    Node.js + Express API                         │
├─────────────────────────────────────────────────────────────────┤
│  Auth Middleware │ Tenant Middleware │ Subscription Middleware   │
├─────────────────────────────────────────────────────────────────┤
│  Services: Stock │ Orders │ Clients │ Payments │ Reports        │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DATA TIER                               │
├──────────────────┬──────────────────┬───────────────────────────┤
│   PostgreSQL     │   Redis          │   External APIs           │
│   (RLS Enabled)  │   (Sessions/Cache)│  (Google Drive, Yandex)  │
└──────────────────┴──────────────────┴───────────────────────────┘

## Tech Stack Summary

| Layer      | Technology               | Purpose                           |
| ---------- | ------------------------ | --------------------------------- |
| Runtime    | Node.js v20 LTS          | Server environment                |
| Backend    | Express.js + TypeScript  | REST API                          |
| Frontend   | React 18 + Vite          | SPA web application               |
| Styling    | Tailwind CSS (Dark Mode) | UI styling                        |
| Database   | PostgreSQL 15+           | Primary data store                |
| ORM        | Prisma                   | Type-safe database access         |
| Auth       | Supabase Auth or Clerk   | Authentication                    |
| Validation | Zod                      | Runtime schema validation         |
| i18n       | i18next                  | Internationalization (EN, RU, UZ) |
| Monorepo   | Turborepo                | Workspace management              |
| Testing    | Vitest + Supertest       | Unit & integration tests          |
| Containers | Docker                   | Deployment                        |

## Multi-Tenancy Strategy

### Data Isolation

- Every business table has `tenant_id` column
- PostgreSQL Row-Level Security (RLS) as safety net
- Application-level tenant middleware enforces access

### Tenant Resolution

1. User authenticates → JWT contains user ID
2. API looks up user's tenant memberships
3. Request header `X-Tenant-ID` specifies active tenant
4. Middleware validates user has access to tenant
5. All queries automatically filter by `tenant_id`

## Subscription Tiers

| Feature             | Basic   | Pro       |
| ------------------- | ------- | --------- |
| Products            | 100 max | Unlimited |
| Clients             | 50 max  | Unlimited |
| Stock Management    | ✅      | ✅        |
| Debt Tracking       | ✅      | ✅        |
| Google Drive Backup | ❌      | ✅        |
| Yandex Delivery     | ❌      | ✅        |
| Reports Export      | Basic   | Advanced  |

## Folder Structure

mirsklada/
├── apps/
│   ├── api/          # Express backend
│   ├── web/          # React frontend
├── packages/
│   ├── shared/       # Types, Zod schemas, utilities
│   ├── database/     # Prisma client
│   └── ui/           # Shared UI components
├── docs/             # Documentation (you are here)
└── docker-compose.yml
