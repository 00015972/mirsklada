# Mirsklada Academic Requirements

> Reference this document for WIUT Level 6 FYP deliverables and standards.

## Required Diagrams

### 1. Entity Relationship Diagram (ERD)
- [ ] All entities with attributes
- [ ] Primary keys marked
- [ ] Foreign key relationships
- [ ] Cardinality notation (1:M, M:N)
- [ ] Tool: Lucidchart or draw.io

### 2. Data Flow Diagrams (DFD)

#### Level 0 - Context Diagram
```
┌─────────┐                              ┌─────────┐
│  Admin  │─── Orders, Stock Updates ───>│         │
│  User   │<── Reports, Notifications ───│         │
└─────────┘                              │         │
                                         │ Mirsklada│
┌─────────┐                              │  System  │
│ Client  │─── View Menu, Check Debt ───>│         │
│         │<── Order Status, Balance ────│         │
└─────────┘                              │         │
                                         │         │
┌─────────┐                              │         │
│External │<── Upload Photos ────────────│         │
│Services │─── OAuth Tokens ─────────────│         │
│(GDrive) │                              └─────────┘
└─────────┘
```

#### Level 1 - Major Processes
- [ ] 1.0 Authentication System
- [ ] 2.0 Inventory Management
- [ ] 3.0 Client Management
- [ ] 4.0 Order Processing
- [ ] 5.0 Payment & Debt Tracking
- [ ] 6.0 Reporting

#### Level 2 - Detailed Processes
- [ ] 2.1 Product CRUD
- [ ] 2.2 Stock Movement Recording
- [ ] 2.3 Stock Level Calculation
- [ ] 4.1 Order Creation
- [ ] 4.2 Price Calculation
- [ ] 4.3 Order Status Updates

### 3. Use Case Diagram
- [ ] Actors: Admin, Staff, Client (Telegram)
- [ ] System boundary
- [ ] Use cases with relationships (include, extend)

**Actor: Admin**
- Manage products
- Manage categories
- Manage clients
- Create/manage orders
- Record payments
- View reports
- Configure settings
- Connect Google Drive

**Actor: Staff**
- View products
- Record stock movements
- Create orders
- View client info

**Actor: Client (Telegram)**
- View product menu
- Check order status
- View debt balance

### 4. Sequence Diagrams

Required sequences:
- [ ] User authentication flow
- [ ] Order creation flow
- [ ] Stock update flow
- [ ] Telegram bot interaction
- [ ] Google Drive OAuth & upload flow
- [ ] Payment recording flow

**Example: Order Creation Sequence**
```
Admin      Web App      API         Database     Stock Service
  │           │          │             │              │
  │──Create───>│          │             │              │
  │  Order    │──POST────>│             │              │
  │           │  /orders  │──Get Client─>│              │
  │           │           │<─Price Matrix│              │
  │           │           │──Calculate──>│              │
  │           │           │   Prices    │              │
  │           │           │──Insert─────>│              │
  │           │           │   Order     │              │
  │           │           │──Record─────────────────────>│
  │           │           │   Stock Out │              │
  │           │           │<─────────────────────Success│
  │           │<──Order───│             │              │
  │<──Display─│   Created │             │              │
  │   Order   │           │             │              │
```

### 5. Class Diagram (Optional but Recommended)
- [ ] Service classes
- [ ] Controller classes
- [ ] Model/Entity classes
- [ ] Relationships and dependencies

---

## Testing Requirements

### Unit Tests (Vitest)

**Required Coverage:**
- [ ] Weight calculation functions
- [ ] Price calculation with matrices
- [ ] Debt balance calculations
- [ ] Currency formatting
- [ ] Validation schemas

```typescript
// Example: Weight calculation tests
describe('Weight Utilities', () => {
  test('roundWeight rounds to 2 decimal places', () => {
    expect(roundWeight(12.345)).toEqual(new Decimal('12.35'));
    expect(roundWeight(12.344)).toEqual(new Decimal('12.34'));
  });

  test('calculateLineTotal multiplies weight by price', () => {
    expect(calculateLineTotal(5.5, 85000)).toEqual(new Decimal('467500.00'));
  });

  test('formatWeight displays with kg suffix', () => {
    expect(formatWeight(12.5)).toBe('12.50 kg');
  });
});
```

### Integration Tests (Supertest)

**Required Coverage:**
- [ ] Authentication endpoints
- [ ] Product CRUD endpoints
- [ ] Order creation endpoint
- [ ] Multi-tenancy isolation
- [ ] Subscription feature gating

```typescript
// Example: Multi-tenancy isolation test
describe('Multi-tenancy Isolation', () => {
  test('user cannot access another tenant products', async () => {
    // Create product in Tenant A
    const productA = await createProduct(tenantAToken, { name: 'Fish' });
    
    // Try to access from Tenant B
    const response = await request(app)
      .get(`/api/v1/products/${productA.id}`)
      .set('Authorization', `Bearer ${tenantBToken}`)
      .set('X-Tenant-ID', tenantBId);
    
    expect(response.status).toBe(404); // Not found (isolated)
  });
});
```

### Test Coverage Target
- Minimum: 60% overall
- Critical paths: 80%+ (auth, orders, payments)

---

## Documentation Deliverables

### 1. Software Requirements Specification (SRS)
- [ ] Introduction & purpose
- [ ] System scope
- [ ] Functional requirements (user stories)
- [ ] Non-functional requirements
- [ ] System constraints
- [ ] Assumptions & dependencies

### 2. System Design Document
- [ ] Architecture overview
- [ ] Technology stack justification
- [ ] Database design
- [ ] API design
- [ ] Security design
- [ ] Deployment architecture

### 3. User Manual
- [ ] Getting started guide
- [ ] Feature documentation
- [ ] Telegram bot usage
- [ ] Troubleshooting
- [ ] Available in: EN, RU, UZ

### 4. Technical Documentation
- [ ] API reference (Swagger/OpenAPI)
- [ ] Database schema
- [ ] Deployment guide
- [ ] Environment setup

### 5. Test Report
- [ ] Test strategy
- [ ] Test cases
- [ ] Test results
- [ ] Coverage report
- [ ] Known issues

---

## Presentation Requirements

### Demo Checklist
- [ ] Multi-tenant login (show 2 different businesses)
- [ ] Product management
- [ ] Stock movement recording
- [ ] Order creation with price calculation
- [ ] Debt tracking
- [ ] Telegram bot demonstration
- [ ] Google Drive upload (if implemented)

### Slides Should Cover
- [ ] Problem statement
- [ ] Solution overview
- [ ] Technical architecture
- [ ] Key features demonstration
- [ ] Challenges faced
- [ ] Future improvements
- [ ] Q&A preparation

---

## Academic Standards

### Code Quality
- TypeScript strict mode
- Consistent naming conventions
- Proper error handling
- Comments for complex logic
- No hardcoded values

### Git Practices
- Meaningful commit messages
- Feature branches
- Regular commits (show development progress)
- Clean commit history

### References
- Cite all external resources
- Document third-party libraries
- Reference academic papers for methodology
