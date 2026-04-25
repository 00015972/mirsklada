# Mirsklada Security Strategy

> Reference this document when implementing security features or handling sensitive data.

## Overview

This document covers security measures for:
1. Authentication & Authorization
2. Multi-tenant Data Isolation
3. OAuth Token Encryption
4. API Security
5. Infrastructure Security

---

## 1. Authentication & Authorization

### Auth Provider
Using **Supabase Auth** (or Clerk) for:
- User registration/login
- JWT token issuance
- Password hashing (bcrypt)
- Session management

### JWT Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1706000000,
  "exp": 1706086400
}
```

### RBAC Roles

| Role | Permissions |
|------|-------------|
| SuperAdmin | System-wide access (platform owner) |
| Admin | Full access to own tenant |
| Staff | Limited access (stock entry, order viewing) |

### Role Enforcement
```typescript
// Middleware checks role before allowing access
export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }
    next();
  };
};

// Usage
router.delete('/products/:id', requireRole('admin'), deleteProduct);
```

---

## 2. Multi-tenant Data Isolation

### Defense in Depth Strategy

┌─────────────────────────────────────────────────────────┐
│                    Layer 1: API                          │
│         Tenant middleware validates X-Tenant-ID          │
│         User must be member of requested tenant          │
├─────────────────────────────────────────────────────────┤
│                    Layer 2: Service                      │
│         All queries include WHERE tenant_id = ?          │
│         Never trust user input for tenant_id             │
├─────────────────────────────────────────────────────────┤
│                    Layer 3: Database                     │
│         Row-Level Security (RLS) as safety net           │
│         Even direct DB access is tenant-scoped           │
└─────────────────────────────────────────────────────────┘

### Tenant Middleware
```typescript
// CRITICAL: Never trust client-provided tenant_id
export const resolveTenant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const requestedTenantId = req.headers['x-tenant-id'] as string;
  
  if (!requestedTenantId) {
    throw new AppError('Tenant ID required', 400, 'TENANT_REQUIRED');
  }

  // Verify user has access to this tenant
  const membership = await prisma.tenantMember.findFirst({
    where: {
      userId: req.user.id,
      tenantId: requestedTenantId,
      status: 'active'
    }
  });

  if (!membership) {
    throw new AppError('Access denied', 403, 'TENANT_ACCESS_DENIED');
  }

  // Set validated tenant ID
  req.tenantId = requestedTenantId;
  next();
};
```

### Service Layer Pattern
```typescript
// ALWAYS include tenantId in queries
async findById(tenantId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { 
      id: productId,
      tenantId // ← CRITICAL: prevents cross-tenant access
    }
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
}
```

### Row-Level Security (Postgres)
```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation ON products
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Set context before queries (in middleware)
SELECT set_config('app.current_tenant_id', $1, true);
```

---

## 3. OAuth Token Encryption (Google Drive)

### Why Encrypt?
OAuth tokens (access + refresh) allow full access to user's Google Drive. If leaked:
- Attacker can read/delete all files
- Attacker can impersonate user
- No way to revoke without user action

### Encryption Strategy

┌─────────────────────────────────────────────────────────┐
│                 Token Encryption Flow                    │
└─────────────────────────────────────────────────────────┘

1. User completes Google OAuth
          │
          ▼
2. Receive: access_token, refresh_token, expires_at
          │
          ▼
3. Generate random IV (16 bytes)
          │
          ▼
4. Encrypt with AES-256-GCM
   ┌────────────────────────────────────────────┐
   │ Key: ENCRYPTION_KEY from env (32 bytes)    │
   │ Algorithm: AES-256-GCM                     │
   │ IV: Random 16 bytes                        │
   │ Plaintext: JSON.stringify({                │
   │   access_token, refresh_token, expires_at  │
   │ })                                         │
   └────────────────────────────────────────────┘
          │
          ▼
5. Store in tenant_secrets table:
   - encrypted_token (base64)
   - iv (base64)
   - provider: 'google_drive'

### Implementation

```typescript
// apps/api/src/utils/encryption.ts
import crypto from 'crypto';
import { env } from '@/config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(env.ENCRYPTION_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Append auth tag to encrypted data
  const encryptedWithTag = Buffer.concat([
    Buffer.from(encrypted, 'base64'),
    authTag
  ]).toString('base64');

  return {
    encrypted: encryptedWithTag,
    iv: iv.toString('base64')
  };
}

export function decrypt(encryptedWithTag: string, ivBase64: string): string {
  const iv = Buffer.from(ivBase64, 'base64');
  const encryptedBuffer = Buffer.from(encryptedWithTag, 'base64');
  
  // Extract auth tag (last 16 bytes)
  const authTag = encryptedBuffer.slice(-AUTH_TAG_LENGTH);
  const encrypted = encryptedBuffer.slice(0, -AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(env.ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Token Storage & Retrieval

```typescript
// Store encrypted token
async function storeOAuthToken(tenantId: string, tokens: GoogleTokens) {
  const plaintext = JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiry_date
  });

  const { encrypted, iv } = encrypt(plaintext);

  await prisma.tenantSecret.upsert({
    where: { tenantId_provider: { tenantId, provider: 'google_drive' } },
    update: { encryptedToken: encrypted, iv, updatedAt: new Date() },
    create: { tenantId, provider: 'google_drive', encryptedToken: encrypted, iv }
  });
}

// Retrieve and decrypt token
async function getOAuthToken(tenantId: string): Promise<GoogleTokens | null> {
  const secret = await prisma.tenantSecret.findUnique({
    where: { tenantId_provider: { tenantId, provider: 'google_drive' } }
  });

  if (!secret) return null;

  const decrypted = decrypt(secret.encryptedToken, secret.iv);
  return JSON.parse(decrypted);
}
```

### Key Management

```bash
# Generate a secure 32-byte (256-bit) key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Store in .env (NEVER commit this!)
ENCRYPTION_KEY=a1b2c3d4e5f6...64_hex_characters
```

---

## 4. API Security

### Input Validation
```typescript
// All inputs validated with Zod
const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    basePricePerKg: z.number().positive().multipleOf(0.01),
    categoryId: z.string().uuid().optional(),
  })
});

router.post('/products', validate(createProductSchema), createProduct);
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
});

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
});
```

### CORS Configuration
```typescript
app.use(cors({
  origin: [
    'https://app.mirsklada.uz',
    'http://localhost:5173' // dev only
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
}));
```

### Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

---

## 5. Security Checklist

### Development
- [ ] Never commit `.env` files
- [ ] Use `.env.example` with placeholder values
- [ ] Validate all inputs with Zod
- [ ] Sanitize data before database operations
- [ ] Never log sensitive data (passwords, tokens)

### Authentication
- [ ] Use HTTPS everywhere
- [ ] Implement rate limiting on auth endpoints
- [ ] Secure password requirements
- [ ] JWT expiration (short-lived access tokens)

### Multi-tenancy
- [ ] All tables have `tenant_id` column
- [ ] Tenant middleware on all routes
- [ ] RLS enabled on all tables
- [ ] Test cross-tenant access prevention

### Token Handling
- [ ] Encrypt OAuth tokens at rest
- [ ] Use secure key management
- [ ] Implement token refresh logic
- [ ] Handle token revocation

### Deployment
- [ ] Environment variables in secure vault
- [ ] Database connection over SSL
- [ ] Regular security updates
- [ ] Audit logging for sensitive operations
