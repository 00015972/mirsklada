# 📦 MirSklada - Inventory Management System

A web-based Inventory Management System for wholesale retail businesses in Uzbekistan, featuring automated stock control, sales operations, and Telegram Bot integration.

![CI Status](https://github.com/username/mirsklada/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Role-based access control (Owner, Warehouse Manager, Salesperson)
- 📦 **Product Management** - Multiple units, categories, barcode support
- 🏢 **Supplier Management** - Track purchases, credit terms, debt, partial payments
- 👥 **Client Management** - Custom pricing, credit accounts, debt tracking
- 🛒 **Order Management** - Create orders, auto-calculate prices, delivery tracking
- 💰 **Payment Tracking** - Cash & bank transfer, partial payments, outstanding balances
- 📊 **Reports & Analytics** - Daily sales, profit margins, stock alerts, client statistics
- 🌐 **Multi-language** - Uzbek, Russian, English support

### Integrations
- 🤖 **Telegram Bot** - Order creation, notifications, receipt delivery
- 🚗 **Delivery Tracking** - Self-delivery & Taxi delivery options
- 🧾 **PDF Receipts** - Automatic generation and delivery

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, React Query, Zustand, i18next |
| **Backend** | Node.js 20, Express.js |
| **Database** | PostgreSQL 15 (via Supabase) |
| **Authentication** | Supabase Auth, JWT |
| **Bot** | Telegram Bot API (node-telegram-bot-api) |
| **Testing** | Jest, Supertest, Vitest, React Testing Library |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel (frontend), Railway (backend), Supabase (database) |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- PostgreSQL >= 15 (or Supabase account)
- Telegram Bot Token (from @BotFather)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/mirsklada.git
   cd mirsklada
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server && npm install

   # Install frontend dependencies
   cd ../client && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp server/.env.example server/.env
   
   # Frontend
   cp client/.env.example client/.env
   ```

4. **Configure environment variables**
   
   Edit `server/.env`:
   ```env
   NODE_ENV=development
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   TELEGRAM_BOT_TOKEN=your_bot_token
   JWT_SECRET=your_jwt_secret
   ```

   Edit `client/.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api/v1
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

5. **Set up the database**
   ```bash
   # Run database migrations (if using local PostgreSQL)
   cd server
   npm run db:migrate
   npm run db:seed
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api-docs

## 📁 Project Structure

```
mirsklada/
├── .github/                # GitHub configurations
│   ├── copilot-instructions.md
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── pull_request_template.md
│
├── docs/                   # Documentation
│   ├── planning/           # Sprint & milestone tracking
│   ├── diagrams/           # ERD, DFD, Use Case diagrams
│   └── api/                # API documentation
│
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Database, Telegram config
│   │   ├── middlewares/    # Auth, Role, Error middlewares
│   │   ├── modules/        # Feature modules (auth, products, etc.)
│   │   └── utils/          # Helpers (PDF, price calc, stock)
│   └── tests/              # Backend tests
│
├── client/                 # Frontend (React + Vite)
│   ├── public/locales/     # Translation files
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API service layer
│       └── store/          # State management
│
└── database/               # Database scripts
    ├── schema.sql
    ├── seed.sql
    └── migrations/
```

## 📖 API Documentation

API documentation is available at `/api-docs` when running the server.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** | | |
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/logout` | User logout |
| **Products** | | |
| GET | `/api/v1/products` | Get all products |
| POST | `/api/v1/products` | Create product |
| GET | `/api/v1/products/:id` | Get product by ID |
| PUT | `/api/v1/products/:id` | Update product |
| DELETE | `/api/v1/products/:id` | Delete product |
| **Orders** | | |
| GET | `/api/v1/orders` | Get all orders |
| POST | `/api/v1/orders` | Create order |
| PUT | `/api/v1/orders/:id/status` | Update order status |
| **Reports** | | |
| GET | `/api/v1/reports/daily-sales` | Daily sales report |
| GET | `/api/v1/reports/low-stock` | Low stock alerts |
| GET | `/api/v1/reports/client-debt` | Client debt summary |

## 🧪 Testing

```bash
# Run all backend tests
cd server && npm test

# Run backend tests with coverage
cd server && npm run test:coverage

# Run frontend tests
cd client && npm test

# Run frontend tests with coverage
cd client && npm run test:coverage

# Run specific test file
npm test -- products.service.test.js
```

### Test Coverage Goals
- Minimum 70% coverage for all modules
- 100% coverage for critical business logic (price calculation, stock management)

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client && vercel
```

### Backend (Railway)
```bash
# Connect to Railway
railway login
railway link

# Deploy
railway up
```

### Database (Supabase)
1. Create project at [supabase.com](https://supabase.com)
2. Run migrations via Supabase Dashboard or CLI
3. Configure environment variables

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

### Quick Start
1. Create a branch: `git checkout -b feature/IMS-001-description`
2. Make changes following coding standards
3. Write tests for new functionality
4. Commit using conventional commits: `feat(products): add search`
5. Push and create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.

## 👤 Author

**Student Name**
- University: Westminster International University in Tashkent
- Program: BSc (Hons) Business Information Systems
- Module: Business Information Systems Project (6BUIS007C-n)
- Academic Year: 2025-2026

---

*This project was developed as part of the Final Year Project for BSc Business Information Systems at WIUT.*
