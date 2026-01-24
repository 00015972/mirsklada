# GitHub Copilot Instructions - MirSklada Inventory Management System

## Project Overview

**MirSklada** is a web-based Inventory Management System (IMS) designed for wholesale retail businesses in Uzbekistan. It automates purchasing, stock control, sales operations, and integrates with Telegram Bot for order management.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, i18next (UZ/RU/EN) |
| **Backend** | Node.js 20, Express.js |
| **Database** | PostgreSQL via Supabase |
| **Authentication** | Supabase Auth (JWT) |
| **Bot** | Telegram Bot API (node-telegram-bot-api) |
| **Testing** | Jest, Supertest (backend), Vitest, React Testing Library (frontend) |
| **Deployment** | Vercel (frontend), Railway (backend), Supabase (database) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                 │
│         Multi-language: UZ, RU, EN using i18next                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                 │
│  • Business Logic    • Telegram Bot    • PDF Receipt Generation │
│  • Report Generation • Price Calculator • Stock Manager         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (BaaS)                              │
│  • Authentication    • PostgreSQL Database with RLS            │
│  • Realtime          • File Storage                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
mirsklada/
├── .github/                    # GitHub configurations
│   ├── copilot-instructions.md # This file
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   ├── workflows/              # CI/CD pipelines
│   └── pull_request_template.md
│
├── docs/                       # Documentation
│   ├── planning/               # Sprint & milestone tracking
│   ├── diagrams/               # ERD, DFD, Use Case diagrams
│   └── api/                    # API documentation
│
├── server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Database, Telegram config
│   │   ├── middlewares/        # Auth, Role, Error middlewares
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── suppliers/
│   │   │   ├── clients/
│   │   │   ├── purchases/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── reports/
│   │   │   └── telegram-bot/
│   │   └── utils/              # Helpers (PDF, price calc, stock)
│   └── tests/                  # Backend tests
│
├── client/                     # Frontend (React + Vite)
│   ├── public/locales/         # Translation files (en, ru, uz)
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Page components
│       ├── hooks/              # Custom React hooks
│       ├── services/           # API service layer
│       ├── store/              # State management (Zustand)
│       └── utils/              # Formatters, validators
│
└── database/                   # Database scripts
    ├── schema.sql              # Full schema
    ├── seed.sql                # Sample data
    └── migrations/             # Migration files
```

---

## Coding Standards

### General Rules

- Use **ES6+** features (const/let, arrow functions, async/await)
- Use **TypeScript-like JSDoc** comments for complex functions
- All API responses follow consistent format: `{ success, data, message, error }`
- All monetary values stored as `DECIMAL(15, 2)` in UZS
- All quantities stored as `DECIMAL(15, 2)` for weight precision

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `productName`, `totalAmount` |
| Functions | camelCase | `calculateTotal()`, `getClientDebt()` |
| React Components | PascalCase | `ProductCard`, `OrderList` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Database tables | snake_case | `order_items`, `client_payments` |
| API endpoints | kebab-case | `/api/v1/client-prices` |
| CSS classes | kebab-case (BEM) | `product-card__title--active` |

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase.jsx | `ProductCard.jsx` |
| Hooks | camelCase.js | `useProducts.js` |
| Services | camelCase.service.js | `products.service.js` |
| Controllers | camelCase.controller.js | `products.controller.js` |
| Tests | *.test.js / *.test.jsx | `products.service.test.js` |

---

## Business Logic Rules

### Multi-tenancy
- Every database query MUST filter by `organization_id`
- Use Supabase Row Level Security (RLS) as additional protection
- Never expose data across organizations

### Pricing Logic
```javascript
// Priority order for getting product price:
// 1. Client-specific price (client_prices table)
// 2. Product unit price (product_units table)
// 3. Base product selling price (products table)

function getProductPrice(productId, clientId, unitId) {
  // Check client-specific price first
  // Then product unit price
  // Finally base price with unit conversion
}
```

### Stock Management
```javascript
// Stock changes ONLY through these operations:
// 1. Purchase IN  → stock increases (purchase_items)
// 2. Order OUT    → stock decreases (order_items) when status = 'completed'
// 3. Adjustment   → manual correction with reason (stock_movements)

// All stock movements logged in stock_movements table for audit
```

### Unit Conversion
```javascript
// Base unit is the primary unit (e.g., kg for rice)
// conversion_factor = how many base units in this unit
// Example: 1 bag = 50 kg → conversion_factor = 50

function convertToBaseUnit(quantity, conversionFactor) {
  return quantity * conversionFactor;
}
```

---

## User Roles & Permissions

| Permission | Owner | Warehouse Manager | Salesperson |
|------------|-------|-------------------|-------------|
| View purchase price | ✅ | ✅ | ❌ |
| View selling price | ✅ | ✅ | ✅ |
| Manage products | ✅ | ✅ | ❌ |
| Manage stock | ✅ | ✅ | ❌ |
| Create orders | ✅ | ✅ | ✅ |
| View all orders | ✅ | ✅ | Own only |
| View reports | ✅ (Full) | ✅ (Stock) | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Manage clients | ✅ | ✅ | ✅ (View) |
| Manage suppliers | ✅ | ✅ | ❌ |

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

---

## Database Key Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant business accounts |
| `users` | System users with roles |
| `products` | Product catalog with pricing |
| `product_units` | Multiple units per product |
| `suppliers` | Supplier information & debt |
| `clients` | Client information & debt |
| `client_prices` | Custom pricing per client |
| `purchases` | Incoming stock from suppliers |
| `orders` | Outgoing sales to clients |
| `supplier_payments` | Payments to suppliers |
| `client_payments` | Payments from clients |
| `stock_movements` | Audit trail for stock changes |

---

## Git Workflow

### Branch Naming
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/IMS-XXX-description` - New features
- `bugfix/IMS-XXX-description` - Bug fixes
- `hotfix/IMS-XXX-description` - Critical fixes

### Commit Convention (Conventional Commits)
```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scopes: auth, products, suppliers, clients, orders, purchases, payments, reports, telegram, ui
```

Examples:
- `feat(products): add multiple unit support`
- `fix(orders): correct price calculation for bulk orders`
- `docs(api): update endpoint documentation`
- `test(auth): add unit tests for login service`

---

## Testing Guidelines

### Backend Tests (Jest + Supertest)
- Unit tests for services: `server/tests/unit/`
- Integration tests for API: `server/tests/integration/`
- Test coverage target: 70%

### Frontend Tests (Vitest + RTL)
- Component tests colocated: `Component.test.jsx`
- Hook tests: `useHook.test.js`
- Test coverage target: 70%

### Test Naming Convention
```javascript
describe('ProductService', () => {
  describe('getProductById', () => {
    it('should return product when found', async () => {});
    it('should throw error when product not found', async () => {});
  });
});
```

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
TELEGRAM_BOT_TOKEN=
JWT_SECRET=
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Common Patterns

### Service Layer Pattern (Backend)
```javascript
// products.service.js
class ProductService {
  async getAll(organizationId, filters) { }
  async getById(organizationId, productId) { }
  async create(organizationId, data) { }
  async update(organizationId, productId, data) { }
  async delete(organizationId, productId) { }
}
```

### Custom Hook Pattern (Frontend)
```javascript
// useProducts.js
export function useProducts(filters) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getAll(filters)
  });
  return { products: data, isLoading, error };
}
```

---

## Important Notes for Copilot

1. **Always include organization_id** in database queries for multi-tenancy
2. **Never expose purchase_price** to salesperson role
3. **Use Decimal.js** for all monetary calculations to avoid floating-point errors
4. **Log all stock changes** to stock_movements table
5. **Validate unit conversions** before stock operations
6. **Support all three languages** (en, ru, uz) for user-facing strings
7. **Follow REST conventions** for API endpoints
8. **Include proper error handling** with try-catch and error middleware
9. **Use transactions** for operations that modify multiple tables
10. **Add JSDoc comments** for complex business logic functions
