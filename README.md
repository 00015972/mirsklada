<<<<<<< HEAD
# 🏗️ Mirsklada

> Multi-tenant SaaS Inventory Management System for Uzbekistan's Wholesale Food Market

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Overview

**mirsklada** is a weight-based inventory management system designed for wholesale food businesses (fish, meat, cheese) in Uzbekistan. It features:

- 🏢 **Multi-tenancy** with strict data isolation (Row-Level Security)
- ⚖️ **Weight-based calculations** (2 decimal precision)
- 🤖 **Dual Telegram bots** (Admin & Client)
- 💳 **Local payment gateways** (Click, Payme)
- ☁️ **Google Drive integration** (BYOD storage)
- 🌍 **Multi-language** (English, Russian, Uzbek)

## 🛠️ Tech Stack

| Layer        | Technology                     |
| ------------ | ------------------------------ |
| **Runtime**  | Node.js v20 LTS                |
| **Language** | TypeScript (strict mode)       |
| **Backend**  | Express.js                     |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Database** | PostgreSQL 15+ with RLS        |
| **ORM**      | Prisma                         |
| **Bots**     | grammY                         |
| **Monorepo** | Turborepo + pnpm               |

## 📁 Project Structure

```
mirsklada/
├── apps/
│   ├── api/              # Express REST API
│   ├── web/              # React frontend
│   ├── bot-admin/        # Admin Telegram bot
│   └── bot-client/       # Client Telegram bot
├── packages/
│   ├── shared/           # Types, schemas, utilities
│   └── database/         # Prisma client
├── docs/                 # Documentation
└── .github/
    ├── prompts/          # Reusable Copilot prompts
    └── skills/           # Copilot coding patterns
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mirsklada.git
cd mirsklada

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Set up database (after configuring .env)
pnpm db:generate
pnpm db:push

# Start development
pnpm dev
```

## 📜 Scripts

| Script            | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Start all apps in development mode |
| `pnpm build`      | Build all packages                 |
| `pnpm test`       | Run tests                          |
| `pnpm lint`       | Lint all packages                  |
| `pnpm db:studio`  | Open Prisma Studio                 |
| `pnpm db:migrate` | Run database migrations            |

## 📚 Documentation

- [Architecture](docs/01-architecture.md)
- [Database Schema](docs/02-database-schema.md)
- [API Reference](docs/03-api-reference.md)
- [Feature Roadmap](docs/04-feature-roadmap.md)
- [Security](docs/05-security.md)
- [Academic Requirements](docs/06-academic-requirements.md)

## 🎓 Academic Context

This project is a Level 6 Final Year Project for WIUT (Westminster International University in Tashkent), supervised by Dr. Pooja.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Author:** Mirsodiq Akramov  
**Email:** akramov.mirsodiq@gmail.com
=======
# mirsklada
Inventory Management App for Wholesale Business
>>>>>>> e2b1e7e8fa150d4f656ff86149b7f74464f48f2b
