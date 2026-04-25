# Mirsklada Feature Roadmap

> Reference this document when planning what to build next.

## Phase Overview

| Phase   | Timeline     | Focus        | Status         |
| ------- | ------------ | ------------ | -------------- |
| Phase 1 | Jan-Feb 2026 | MVP Core     | 🔄 In Progress |
| Phase 2 | March 2026   | Integrations | ⏳ Planned     |
| Phase 3 | April 2026   | Advanced     | ⏳ Planned     |
| Phase 4 | May 2026     | Polish       | ⏳ Planned     |

---

## Phase 1: MVP Core (January - February 2026)

### 1.1 Project Setup

- [x] Initialize Turborepo monorepo
- [x] Configure TypeScript (strict mode)
- [x] Setup PostgreSQL + Prisma
- [x] Configure Docker Compose for local dev
- [ ] Setup ESLint + Prettier
- [ ] Configure Vitest for testing

### 1.2 Authentication & Multi-tenancy

- [ ] Integrate Supabase Auth (or Clerk)
- [ ] User registration/login flow
- [ ] Tenant creation wizard
- [ ] Tenant switcher UI component
- [ ] `TenantMember` RBAC (Admin, Staff roles)
- [ ] Row-Level Security setup
- [ ] Auth middleware for API
- [ ] Tenant middleware for API

### 1.3 Product Management

- [ ] `Category` CRUD
- [ ] `Product` CRUD
- [ ] Weight validation (2 decimal places)
- [ ] Product list with search/filter
- [ ] Product detail view
- [ ] Category management UI

### 1.4 Stock Management

- [ ] Stock-in recording (purchases)
- [ ] Stock-out recording (sales/damage)
- [ ] Real-time stock balance calculation
- [ ] Stock movement history view
- [ ] Low stock alerts (visual indicator)

### 1.5 Client Management

- [ ] `Client` CRUD
- [ ] Client list with search
- [ ] Client detail with order history
- [ ] Debt balance display
- [ ] Basic price matrix assignment

### 1.6 Order Management

- [ ] Create order for client
- [ ] Auto-calculate line totals (weight × price)
- [ ] Apply client's price matrix
- [ ] Order status workflow
- [ ] Order list view
- [ ] Order detail view

### 1.7 Debt & Payments

- [ ] Manual payment recording
- [ ] Debt ledger entries (DEBIT/CREDIT)
- [ ] Client debt balance view
- [ ] Payment history

### 1.8 Basic UI

- [ ] Dark mode Tailwind theme
- [ ] Responsive sidebar layout
- [ ] Dashboard with key metrics
- [ ] i18n setup (EN, RU, UZ)
- [ ] Optimistic UI updates
- [ ] Loading states & skeletons
- [ ] Toast notifications

### 🎯 Milestone: MVP Demo (End of February)

> Demonstrate: Multi-tenant login, product/stock CRUD, order creation, debt tracking

---

## Phase 2: Integrations (March 2026)

### 2.1 Google Drive Integration

- [ ] OAuth consent screen setup
- [ ] Token encryption (AES-256-GCM)
- [ ] Connect/disconnect flow
- [ ] Photo upload to owner's Drive
- [ ] Drive file reference storage
- [ ] Connection status UI

### 2.2 Subscription System

- [ ] Tier configuration (Basic/Pro)
- [ ] Feature gating middleware
- [ ] Usage limits enforcement
- [ ] Subscription status UI
- [ ] Upgrade prompts

### 🎯 Milestone: Integrations Complete (End of March)

> Demonstrate: Google Drive photo backup

---

## Phase 3: Advanced Features (April 2026)

### 3.1 Payment Gateways

- [ ] Click integration (Uzbekistan)
- [ ] Payme integration (Uzbekistan)
- [ ] Dodo Payments (international)
- [ ] Webhook handlers
- [ ] Payment status updates
- [ ] Subscription billing flow

### 3.2 Yandex Delivery (Pro)

- [ ] API integration
- [ ] Address validation
- [ ] Delivery cost estimation
- [ ] Order dispatch automation
- [ ] Delivery status tracking
- [ ] Driver assignment

### 3.3 Reports & Analytics

- [ ] Daily sales summary
- [ ] Weekly/monthly trends
- [ ] Top-selling products
- [ ] Client purchase patterns
- [ ] Debt aging report
- [ ] Export to Excel/PDF

### 3.4 Price Matrices (Advanced)

- [ ] Multiple matrices per tenant
- [ ] Bulk price updates
- [ ] Price history tracking
- [ ] Seasonal price adjustments

### 🎯 Milestone: Feature Complete (End of April)

> Demonstrate: Payment processing, delivery integration, reporting

---

## Phase 4: Polish & Documentation (May 2026)

### 4.1 Testing

- [ ] Unit tests for weight calculations
- [ ] Unit tests for price calculations
- [ ] Integration tests for API endpoints
- [ ] Multi-tenancy isolation tests
- [ ] E2E tests for critical flows
- [ ] Load testing

### 4.2 Documentation

- [ ] API documentation (Swagger/OpenAPI)
- [ ] User manual (EN, RU, UZ)
- [ ] Deployment guide
- [ ] Academic report writing
- [ ] All UML diagrams finalized

### 4.3 Deployment

- [ ] Docker production images
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Render/Railway deployment
- [ ] Domain setup (mirsklada.uz)
- [ ] SSL certificates
- [ ] Monitoring setup

### 4.4 Final Polish

- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness audit
- [ ] Security audit
- [ ] Bug fixes from testing

### 🎯 Milestone: Project Submission (End of May)

> Deliverables: Working system, documentation, presentation

---

## Future Ideas (Post-Submission)

These are NOT in scope for FYP but noted for potential future development:

- [ ] Mobile app (React Native)
- [ ] AI demand forecasting
- [ ] Multi-warehouse support
- [ ] Barcode/scale integration
- [ ] WhatsApp Business integration
- [ ] SMS via Eskiz.uz
- [ ] 1C accounting integration
- [ ] Franchise management
- [ ] QR code invoices
