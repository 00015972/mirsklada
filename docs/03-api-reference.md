# Mirsklada API Reference

> Reference this document when building or consuming API endpoints.

## Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.mirsklada.uz/api/v1
```

## Authentication

All endpoints (except `/auth/*`) require:

```http
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "i18n.key" // optional
}
```

### Success with Pagination

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID xyz not found"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | No access to resource |
| `TENANT_REQUIRED` | 400 | Missing X-Tenant-ID header |
| `TENANT_ACCESS_DENIED` | 403 | User not member of tenant |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `FEATURE_REQUIRES_PRO` | 403 | Feature needs Pro subscription |

---

## Endpoints

### Auth

#### POST /auth/register
Create new user account.

```json
// Request
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}

// Response
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "..." },
    "token": "jwt..."
  }
}
```

#### POST /auth/login
Authenticate user.

#### POST /auth/telegram/verify
Verify Telegram user (for bots).

```json
// Request
{
  "telegramId": 123456789
}
```

---

### Tenants

#### GET /tenants
List user's tenants.

#### POST /tenants
Create new tenant (business).

```json
// Request
{
  "name": "My Warehouse",
  "slug": "my-warehouse"
}
```

#### GET /tenants/:id
Get tenant details.

---

### Products

#### GET /products
List all products.

Query params:
- `page` (default: 1)
- `limit` (default: 20)
- `search` - Search by name
- `categoryId` - Filter by category
- `active` - Filter by active status

#### GET /products/:id
Get product details.

#### POST /products
Create product.

```json
// Request
{
  "name": "Salmon Fillet",
  "categoryId": "uuid",
  "basePricePerKg": 85000,
  "minStockKg": 10
}
```

#### PATCH /products/:id
Update product.

#### DELETE /products/:id
Delete product (soft delete).

---

### Stock

#### GET /stock/movements
List stock movements.

Query params:
- `productId` - Filter by product
- `type` - Filter by type (IN/OUT/ADJUST)
- `startDate` - From date
- `endDate` - To date

#### POST /stock/movements
Record stock movement.

```json
// Request (Stock In)
{
  "productId": "uuid",
  "type": "IN",
  "quantityKg": 50.5,
  "notes": "Delivery from supplier"
}

// Request (Stock Out - manual)
{
  "productId": "uuid",
  "type": "OUT",
  "quantityKg": 5.25,
  "notes": "Damaged goods"
}
```

#### POST /stock/adjust
Quick stock adjustment.

```json
// Request
{
  "productId": "uuid",
  "newQuantityKg": 100.00,
  "reason": "Physical inventory count"
}
```

---

### Clients

#### GET /clients
List all clients.

Query params:
- `search` - Search by name or phone
- `hasDebt` - Filter clients with debt > 0

#### GET /clients/:id
Get client details with debt history.

#### POST /clients
Create client.

```json
// Request
{
  "name": "Pizza Palace",
  "contactPerson": "Ahmed",
  "phone": "+998901234567",
  "address": "Tashkent, Yunusabad",
  "priceMatrixId": "uuid" // optional
}
```

#### GET /clients/:id/debt
Get client's debt ledger.

---

### Orders

#### GET /orders
List orders.

Query params:
- `clientId` - Filter by client
- `status` - Filter by status
- `startDate` / `endDate`

#### GET /orders/:id
Get order with items.

#### POST /orders
Create order.

```json
// Request
{
  "clientId": "uuid",
  "items": [
    { "productId": "uuid", "quantityKg": 5.5 },
    { "productId": "uuid", "quantityKg": 3.25 }
  ],
  "notes": "Deliver before 10am",
  "deliveryDate": "2026-01-25"
}

// Response includes calculated prices
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-2026-0001",
    "items": [
      {
        "productName": "Salmon Fillet",
        "quantityKg": 5.5,
        "pricePerKg": 85000,
        "lineTotal": 467500
      }
    ],
    "totalAmount": 735000,
    "status": "pending"
  }
}
```

#### PATCH /orders/:id/status
Update order status.

```json
// Request
{
  "status": "delivered"
}
```

---

### Payments

#### GET /payments
List payments.

#### POST /payments
Record payment.

```json
// Request
{
  "clientId": "uuid",
  "amount": 500000,
  "method": "cash",
  "notes": "Partial payment for order #123"
}
```

---

### Price Matrices

#### GET /price-matrices
List price matrices.

#### POST /price-matrices
Create price matrix.

```json
// Request
{
  "name": "VIP Clients",
  "items": [
    { "productId": "uuid", "customPriceKg": 80000 },
    { "productId": "uuid", "customPriceKg": 65000 }
  ]
}
```

---

### Reports

#### GET /reports/sales
Sales report.

Query params:
- `startDate` (required)
- `endDate` (required)
- `groupBy` - day | week | month

#### GET /reports/stock
Current stock levels report.

#### GET /reports/debt
Client debt aging report.

---

### Uploads (Pro only)

#### POST /uploads/warehouse-photo
Upload photo to Google Drive.

```json
// Request
{
  "fileUrl": "https://...", // Telegram file URL
  "filename": "warehouse_2026-01-20.jpg"
}

// Response
{
  "success": true,
  "data": {
    "driveFileId": "abc123",
    "filename": "warehouse_2026-01-20.jpg",
    "webViewLink": "https://drive.google.com/..."
  }
}
```

---

### Integrations (Pro only)

#### GET /integrations/google-drive/status
Check Google Drive connection status.

#### POST /integrations/google-drive/connect
Initiate OAuth flow.

#### POST /integrations/google-drive/callback
OAuth callback handler.

#### DELETE /integrations/google-drive/disconnect
Revoke Google Drive access.
