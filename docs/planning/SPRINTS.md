# Sprint Planning - MirSklada IMS

## 📅 Project Timeline Overview

| Sprint | Dates | Focus Area | Status |
|--------|-------|------------|--------|
| Sprint 0 | Jan 24-26, 2026 | Project Setup | 🔄 In Progress |
| Sprint 1 | Jan 27 - Feb 9, 2026 | Authentication & Products | ⏳ Planned |
| Sprint 2 | Feb 10-23, 2026 | Suppliers & Clients | ⏳ Planned |
| Sprint 3 | Feb 24 - Mar 9, 2026 | Purchases & Orders | ⏳ Planned |
| Sprint 4 | Mar 10-23, 2026 | Payments & Reports | ⏳ Planned |
| Sprint 5 | Mar 24 - Apr 6, 2026 | Telegram Bot | ⏳ Planned |
| Sprint 6 | Apr 7-10, 2026 | Final Testing & Submission | ⏳ Planned |

---

## 📌 BISP Deadlines

| Deliverable | Deadline | Status |
|-------------|----------|--------|
| Supervisor Selection Form | Oct 17, 2025 | ✅ |
| Project Initiation Document | Oct 24, 2025 | ✅ |
| Progress Report & Demo | Jan 30, 2026 | 🔄 |
| Final Report | Apr 10, 2026 | ⏳ |
| Presentation/Viva | Apr 17-26, 2026 | ⏳ |

---

## Sprint 0: Project Setup (Jan 24-26, 2026)

**Sprint Goal:** Set up development environment and project infrastructure

### Tasks

| ID | Task | Status | Hours |
|----|------|--------|-------|
| S0-1 | Create GitHub repository structure | ✅ | 1 |
| S0-2 | Set up CI/CD pipeline | ✅ | 1 |
| S0-3 | Create documentation templates | ✅ | 1 |
| S0-4 | Initialize backend (Node.js + Express) | ⏳ | 2 |
| S0-5 | Initialize frontend (React + Vite) | ⏳ | 2 |
| S0-6 | Set up Supabase project | ⏳ | 1 |
| S0-7 | Create database schema | ⏳ | 2 |
| S0-8 | Configure development environment | ⏳ | 1 |

**Total Estimated Hours:** 11

---

## Sprint 1: Authentication & Products (Jan 27 - Feb 9, 2026)

**Sprint Goal:** Implement user authentication and product management

### User Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| US-1 | As a user, I can register with email/password | 3 | ⏳ |
| US-2 | As a user, I can login and receive JWT token | 3 | ⏳ |
| US-3 | As an owner, I can manage user roles | 5 | ⏳ |
| US-4 | As a staff, I can view products list | 3 | ⏳ |
| US-5 | As a manager, I can create/edit/delete products | 5 | ⏳ |
| US-6 | As a manager, I can set multiple units per product | 5 | ⏳ |
| US-7 | As a manager, I can categorize products | 3 | ⏳ |

**Total Story Points:** 27

### Technical Tasks

- [ ] Supabase Auth integration
- [ ] JWT middleware implementation
- [ ] Role-based access control middleware
- [ ] Products CRUD API endpoints
- [ ] Product units management
- [ ] Categories management
- [ ] Products list page (frontend)
- [ ] Product form component (frontend)
- [ ] Unit tests for auth service
- [ ] Unit tests for products service

---

## Sprint 2: Suppliers & Clients (Feb 10-23, 2026)

**Sprint Goal:** Implement supplier and client management with custom pricing

### User Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| US-8 | As a manager, I can manage suppliers | 5 | ⏳ |
| US-9 | As a manager, I can track supplier debt | 3 | ⏳ |
| US-10 | As a staff, I can manage clients | 5 | ⏳ |
| US-11 | As a manager, I can set custom prices per client | 5 | ⏳ |
| US-12 | As a manager, I can track client debt | 3 | ⏳ |
| US-13 | As a salesperson, I can view client list (limited) | 2 | ⏳ |

**Total Story Points:** 23

---

## Sprint 3: Purchases & Orders (Feb 24 - Mar 9, 2026)

**Sprint Goal:** Implement purchase and order management

### User Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| US-14 | As a manager, I can record purchases from suppliers | 5 | ⏳ |
| US-15 | As a system, stock auto-updates on purchase | 3 | ⏳ |
| US-16 | As a salesperson, I can create orders for clients | 5 | ⏳ |
| US-17 | As a system, I auto-calculate order prices | 5 | ⏳ |
| US-18 | As a manager, I can set order delivery method | 3 | ⏳ |
| US-19 | As a system, stock auto-deducts on order completion | 3 | ⏳ |
| US-20 | As a staff, I can generate PDF receipts | 5 | ⏳ |

**Total Story Points:** 29

---

## Sprint 4: Payments & Reports (Mar 10-23, 2026)

**Sprint Goal:** Implement payment tracking and reporting

### User Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| US-21 | As a manager, I can record payments to suppliers | 3 | ⏳ |
| US-22 | As a staff, I can record payments from clients | 3 | ⏳ |
| US-23 | As an owner, I can view daily sales report | 5 | ⏳ |
| US-24 | As a manager, I can view low stock alerts | 3 | ⏳ |
| US-25 | As an owner, I can view profit margin reports | 5 | ⏳ |
| US-26 | As an owner, I can view client debt summary | 3 | ⏳ |
| US-27 | As an owner, I can view client purchase statistics | 5 | ⏳ |

**Total Story Points:** 27

---

## Sprint 5: Telegram Bot (Mar 24 - Apr 6, 2026)

**Sprint Goal:** Implement Telegram Bot for orders and notifications

### User Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| US-28 | As a client, I can register via Telegram Bot | 5 | ⏳ |
| US-29 | As a client, I can view product catalog in bot | 3 | ⏳ |
| US-30 | As a client, I can create order via bot | 5 | ⏳ |
| US-31 | As a staff, I receive order notifications | 3 | ⏳ |
| US-32 | As a client, I receive receipt via bot | 3 | ⏳ |
| US-33 | As a staff, I can check stock via bot | 3 | ⏳ |

**Total Story Points:** 22

---

## Sprint 6: Final Testing & Submission (Apr 7-10, 2026)

**Sprint Goal:** Complete testing, documentation, and submission

### Tasks

| ID | Task | Status |
|----|------|--------|
| S6-1 | Complete all unit tests (70% coverage) | ⏳ |
| S6-2 | Complete integration tests | ⏳ |
| S6-3 | Fix remaining bugs | ⏳ |
| S6-4 | Update documentation | ⏳ |
| S6-5 | Deploy to production | ⏳ |
| S6-6 | Prepare final report | ⏳ |
| S6-7 | Create presentation slides | ⏳ |

---

## 📊 Velocity Tracking

| Sprint | Planned Points | Completed Points | Notes |
|--------|----------------|------------------|-------|
| Sprint 0 | - | - | Setup sprint |
| Sprint 1 | 27 | - | |
| Sprint 2 | 23 | - | |
| Sprint 3 | 29 | - | |
| Sprint 4 | 27 | - | |
| Sprint 5 | 22 | - | |

**Average Velocity:** TBD (after Sprint 2)

---

## 🎯 Definition of Done

A user story is considered DONE when:

- [ ] Code implemented and follows coding standards
- [ ] Unit tests written (minimum 70% coverage)
- [ ] Code reviewed (self-review for solo project)
- [ ] Documentation updated
- [ ] Tested manually
- [ ] Merged to develop branch
- [ ] Deployed to staging environment
