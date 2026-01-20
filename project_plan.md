# 🏗️ MIRSKLADA - Project Master Plan

> **Multi-tenant SaaS Inventory Management System for Uzbekistan's Wholesale Food Market**
> 
> Student: Mirsodiq Akramov | Supervisor: Dr Pooja | WIUT Level 6 FYP

---

## 📋 Table of Contents
- [Project Decisions Log](#-project-decisions-log)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Database Schema](#-database-schema)
- [Feature Roadmap](#-feature-roadmap)
- [Security Strategy](#-security-strategy)
- [Academic Deliverables](#-academic-deliverables)
- [Timeline & Milestones](#-timeline--milestones)

---

## ✅ Project Decisions Log

### Authentication & Multi-tenancy
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tenancy Model | Single-domain with Tenant Switcher (`app.mirsklada.uz`) | Simpler DNS, easier to demo |
| Auth Provider | Supabase Auth or Clerk | Saves 2-3 weeks, handles OAuth securely |
| RBAC Roles | SuperAdmin, Admin, Staff | Required complexity for Level 6 |
| Data Isolation | PostgreSQL Row-Level Security (RLS) | Native, secure, academically impressive |

### Subscription & Monetization
| Tier | Features | Gating Type |
|------|----------|-------------|
| **Basic** | Manual accounting, Stock management, Debt tracking | Soft (usage limits) |
| **Pro** | + Telegram Bots + Yandex Logistics + Google Drive Backup | Hard (feature locked) |

### Telegram Bot Strategy
| Bot | Purpose | Priority |
|-----|---------|----------|
| Admin Bot | Stock updates, photo uploads → Google Drive | MVP |
| Client Bot | View orders, check debt balance | MVP |
| Client Bot | Partial payments via bot | Phase 2 |

### Infrastructure
| Area | Decision | Notes |
|------|----------|-------|
| Offline Support | Optimistic UI only (no full PWA) | Fast feel on slow 4G |
| Hosting | Render or Railway (International Cloud) | As per PID |
| Containerization | Docker | WIUT Technical Sophistication criteria |
| Monorepo | Turborepo | Clean separation for academic presentation |

---

## 🏛️ Architecture Overview
┌─────────────────────────────────────────────────────────────────┐
│ PRESENTATION TIER │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ React Web App │ Admin Telegram │ Client Telegram Bot │
│ (Tailwind/i18n)│ Bot (grammY) │ (grammY) │
└────────┬────────┴────────┬────────┴─────────────┬───────────────┘
│ │ │
▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│ APPLICATION TIER │
│ Node.js + Express API │
├─────────────────────────────────────────────────────────────────┤
│ Auth Middleware │ Tenant Middleware │ Subscription Middleware │
├─────────────────────────────────────────────────────────────────┤
│ Services: Stock │ Orders │ Clients │ Payments │ Reports │
└────────┬────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ DATA TIER │
├──────────────────┬──────────────────┬───────────────────────────┤
│ PostgreSQL │ Redis │ External APIs │
│ (RLS Enabled) │ (Sessions/Cache)│ (Google Drive, Yandex) │
└──────────────────┴──────────────────┴───────────────────────────┘


---

## 🛠️ Tech Stack

### Core
- [ ] **Runtime**: Node.js v20 LTS
- [ ] **Backend Framework**: Express.js
- [ ] **Frontend Framework**: React 18 + Vite
- [ ] **Styling**: Tailwind CSS (Dark Mode default)
- [ ] **Database**: PostgreSQL 15+ with RLS
- [ ] **ORM**: Prisma (type-safe, migrations, great for academics)
- [ ] **Auth**: Supabase Auth OR Clerk (TBD after POC)

### Tooling
- [ ] **Monorepo**: Turborepo
- [ ] **Language**: TypeScript (strict mode)
- [ ] **Validation**: Zod (shared schemas between FE/BE)
- [ ] **API Documentation**: Swagger/OpenAPI
- [ ] **Testing**: Vitest (unit) + Supertest (integration)
- [ ] **Containerization**: Docker + Docker Compose

### Integrations
- [ ] **Telegram Bots**: grammY framework
- [ ] **i18n**: i18next (EN, RU, UZ)
- [ ] **Payments (Global)**: Dodo Payments
- [ ] **Payments (Local)**: Click / Payme APIs
- [ ] **Storage**: Google Drive API (BYOD)
- [ ] **Logistics**: Yandex Go/Delivery API (Phase 2)

---

## 📁 Folder Structure
mirsklada/
├── apps/
│ ├── api/ # Express Backend
│ │ ├── src/
│ │ │ ├── config/ # Environment, database config
│ │ │ ├── middleware/ # Auth, tenant, subscription guards
│ │ │ ├── modules/ # Feature-based modules
│ │ │ │ ├── auth/
│ │ │ │ ├── tenants/
│ │ │ │ ├── products/
│ │ │ │ ├── clients/
│ │ │ │ ├── orders/
│ │ │ │ ├── stock/
│ │ │ │ ├── payments/
│ │ │ │ └── reports/
│ │ │ ├── services/ # External API integrations
│ │ │ │ ├── google-drive/
│ │ │ │ ├── telegram/
│ │ │ │ ├── yandex/
│ │ │ │ └── payments/
│ │ │ ├── utils/ # Helpers, weight calculations
│ │ │ └── app.ts # Express app entry
│ │ ├── prisma/
│ │ │ ├── schema.prisma # Database schema
│ │ │ └── migrations/
│ │ ├── tests/
│ │ ├── Dockerfile
│ │ └── package.json
│ │
│ ├── web/ # React Frontend
│ │ ├── src/
│ │ │ ├── components/ # Reusable UI components
│ │ │ ├── features/ # Feature-based folders
│ │ │ │ ├── auth/
│ │ │ │ ├── dashboard/
│ │ │ │ ├── inventory/
│ │ │ │ ├── clients/
│ │ │ │ ├── orders/
│ │ │ │ └── settings/
│ │ │ ├── hooks/ # Custom React hooks
│ │ │ ├── lib/ # API client, utilities
│ │ │ ├── locales/ # i18n translations
│ │ │ │ ├── en/
│ │ │ │ ├── ru/
│ │ │ │ └── uz/
│ │ │ ├── stores/ # Zustand state management
│ │ │ └── App.tsx
│ │ ├── Dockerfile
│ │ └── package.json
│ │
│ ├── bot-admin/ # Admin Telegram Bot
│ │ ├── src/
│ │ │ ├── commands/
│ │ │ ├── conversations/
│ │ │ ├── middleware/
│ │ │ └── bot.ts
│ │ ├── Dockerfile
│ │ └── package.json
│ │
│ └── bot-client/ # Client Telegram Bot
│ ├── src/
│ │ ├── commands/
│ │ ├── conversations/
│ │ ├── middleware/
│ │ └── bot.ts
│ ├── Dockerfile
│ └── package.json
│
├── packages/
│ ├── shared/ # Shared TypeScript types & Zod schemas
│ │ ├── src/
│ │ │ ├── types/
│ │ │ ├── schemas/ # Zod validation schemas
│ │ │ ├── constants/
│ │ │ └── utils/ # Weight calculation functions
│ │ └── package.json
│ │
│ ├── database/ # Prisma client (shared)
│ │ └── package.json
│ │
│ └── ui/ # Shared UI components (optional)
│ └── package.json
│
├── docs/ # Academic Documentation
│ ├── diagrams/
│ │ ├── erd.png
│ │ ├── dfd-level-0.png
│ │ ├── dfd-level-1.png
│ │ ├── dfd-level-2.png
│ │ ├── use-case.png
│ │ └── sequence/
│ ├── api-spec.yaml # OpenAPI specification
│ ├── SRS.md # Software Requirements Specification
│ └── architecture.md
│
├── docker-compose.yml # Local development stack
├── docker-compose.prod.yml # Production deployment
├── turbo.json # Turborepo config
├── package.json # Root package.json
├── .env.example
├── .gitignore
├── LICENSE
└── README.md


---

## 🗄️ Database Schema (Conceptual)

### Core Entities
┌─────────────────────────────────────────────────────────────────┐
│ MULTI-TENANCY │
├─────────────────────────────────────────────────────────────────┤
│ tenants │ id, name, slug, subscription_tier, status │
│ users │ id, tenant_id, email, role, name │
│ tenant_settings │ id, tenant_id, currency, timezone, language │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ INVENTORY │
├─────────────────────────────────────────────────────────────────┤
│ categories │ id, tenant_id, name │
│ products │ id, tenant_id, category_id, name, unit, │
│ │ base_price_per_kg, current_stock_kg │
│ stock_movements │ id, tenant_id, product_id, type (IN/OUT), │
│ │ quantity_kg, reference_id, created_at │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ CLIENTS & PRICING │
├─────────────────────────────────────────────────────────────────┤
│ clients │ id, tenant_id, name, phone, telegram_id, │
│ │ address, debt_balance, price_matrix_id │
│ price_matrices │ id, tenant_id, name, description │
│ price_matrix_items│ id, matrix_id, product_id, custom_price_kg │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ORDERS │
├─────────────────────────────────────────────────────────────────┤
│ orders │ id, tenant_id, client_id, status, total, │
│ │ created_by, created_at, delivered_at │
│ order_items │ id, order_id, product_id, quantity_kg, │
│ │ price_per_kg, line_total │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PAYMENTS & DEBTS │
├─────────────────────────────────────────────────────────────────┤
│ payments │ id, tenant_id, client_id, amount, method, │
│ │ reference, created_at │
│ debt_ledger │ id, tenant_id, client_id, order_id, │
│ │ payment_id, type (DEBIT/CREDIT), amount │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ INTEGRATIONS │
├─────────────────────────────────────────────────────────────────┤
│ tenant_secrets │ id, tenant_id, provider, encrypted_token, │
│ │ iv, metadata, expires_at │
│ drive_files │ id, tenant_id, drive_file_id, filename, │
│ │ purpose, uploaded_at │
│ subscriptions │ id, tenant_id, tier, provider, external_id, │
│ │ status, current_period_end │
└─────────────────────────────────────────────────────────────────┘


### Row-Level Security Policy Example
```sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see products from their tenant
CREATE POLICY tenant_isolation ON products
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

🔐 Security Strategy
Google Drive OAuth Token Handling

┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN SECURITY FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. User initiates Google OAuth in Web App
                    │
                    ▼
2. Google returns access_token + refresh_token
                    │
                    ▼
3. Backend receives tokens (HTTPS only)
                    │
                    ▼
4. Generate random IV (Initialization Vector)
                    │
                    ▼
5. Encrypt tokens with AES-256-GCM
   Key: ENCRYPTION_KEY from environment (32 bytes)
   Plaintext: JSON.stringify({ access_token, refresh_token, expires_at })
                    │
                    ▼
6. Store in tenant_secrets table:
   - encrypted_token (base64)
   - iv (base64)
   - provider: 'google_drive'
   - expires_at
                    │
                    ▼
7. When needed, decrypt with same key + stored IV
                    │
                    ▼
8. Refresh token if expired, re-encrypt, update DB