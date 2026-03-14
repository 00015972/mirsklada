# Prisma & Database Patterns for Mirsklada

## Schema Conventions

### Multi-Tenant Table Template

Every table (except system tables) MUST follow this pattern:

```prisma
model Product {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  
  // ... other fields
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
  @@map("products")
}
```

### Weight Fields

Always use Decimal for weight:

```prisma
model Product {
  currentStockKg  Decimal @default(0) @map("current_stock_kg") @db.Decimal(10, 2)
}

model OrderItem {
  quantityKg      Decimal @map("quantity_kg") @db.Decimal(10, 2)
  pricePerKg      Decimal @map("price_per_kg") @db.Decimal(12, 2)
  lineTotal       Decimal @map("line_total") @db.Decimal(14, 2)
}
```

### Money Fields

Store as integers (tiyin = 1/100 of UZS):

```prisma
model Order {
  totalTiyin      BigInt  @map("total_tiyin")
}
```

Or use Decimal for flexibility:

```prisma
model Payment {
  amount          Decimal @db.Decimal(14, 2)
}
```

## Query Patterns

### Always Filter by Tenant

```typescript
// ❌ DANGEROUS - Never do this
const products = await prisma.product.findMany();

// ✅ CORRECT - Always filter by tenant
const products = await prisma.product.findMany({
  where: { tenantId: req.tenantId }
});
```

### Service Layer Pattern

```typescript
// apps/api/src/modules/products/product.service.ts

import { prisma } from '@mirsklada/database';
import { CreateProductInput, UpdateProductInput } from '@mirsklada/shared';
import { AppError } from '@/utils/app-error';

export class ProductService {
  async findAll(tenantId: string) {
    return prisma.product.findMany({
      where: { tenantId },
      include: { category: true },
      orderBy: { name: 'asc' }
    });
  }

  async findById(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        tenantId // Always include tenant check!
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  async create(tenantId: string, data: CreateProductInput) {
    return prisma.product.create({
      data: {
        ...data,
        tenantId // Always set tenant
      }
    });
  }

  async update(tenantId: string, productId: string, data: UpdateProductInput) {
    // First verify ownership
    await this.findById(tenantId, productId);

    return prisma.product.update({
      where: { id: productId },
      data
    });
  }

  async delete(tenantId: string, productId: string) {
    // First verify ownership
    await this.findById(tenantId, productId);

    return prisma.product.delete({
      where: { id: productId }
    });
  }
}

export const productService = new ProductService();
```

### Stock Movement Pattern

```typescript
// Transactional stock update
async recordStockMovement(
  tenantId: string,
  productId: string,
  type: 'IN' | 'OUT',
  quantityKg: number,
  referenceId?: string
) {
  return prisma.$transaction(async (tx) => {
    // 1. Create movement record
    const movement = await tx.stockMovement.create({
      data: {
        tenantId,
        productId,
        type,
        quantityKg: new Prisma.Decimal(quantityKg),
        referenceId
      }
    });

    // 2. Update product stock
    const delta = type === 'IN' ? quantityKg : -quantityKg;
    
    await tx.product.update({
      where: { id: productId },
      data: {
        currentStockKg: {
          increment: delta
        }
      }
    });

    return movement;
  });
}
```

### Debt Calculation Pattern

```typescript
// Get client's current debt balance
async getClientDebt(tenantId: string, clientId: string) {
  const result = await prisma.debtLedger.aggregate({
    where: {
      tenantId,
      clientId
    },
    _sum: {
      amount: true
    }
  });

  // DEBIT entries are positive, CREDIT entries are negative
  return result._sum.amount || new Prisma.Decimal(0);
}
```

### Price Matrix Query

```typescript
// Get price for a product for a specific client
async getProductPrice(
  tenantId: string,
  productId: string,
  clientId: string
): Promise<Decimal> {
  // 1. Check if client has a custom price matrix
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    include: {
      priceMatrix: {
        include: {
          items: {
            where: { productId }
          }
        }
      }
    }
  });

  // 2. If custom price exists, use it
  if (client?.priceMatrix?.items[0]) {
    return client.priceMatrix.items[0].customPriceKg;
  }

  // 3. Fall back to base product price
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId }
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product.basePricePerKg;
}
```

## Migration Patterns

### Adding RLS Policy (Raw SQL Migration)

```sql
-- migration.sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON products
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::text);

-- Grant permissions
GRANT ALL ON products TO authenticated;
```

### Setting Tenant Context

```typescript
// Middleware to set RLS context
async function setTenantContext(tenantId: string) {
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
}
```

## Prisma Client Extension (Optional)

```typescript
// packages/database/src/client.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const end = performance.now();
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`${model}.${operation} took ${end - start}ms`);
          }
          
          return result;
        },
      },
    },
  });
};

declare global {
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
```

## Common Queries Reference

```typescript
// Pagination
const { skip, take } = getPaginationParams(page, limit);
const [products, total] = await prisma.$transaction([
  prisma.product.findMany({ where: { tenantId }, skip, take }),
  prisma.product.count({ where: { tenantId } })
]);

// Search
const products = await prisma.product.findMany({
  where: {
    tenantId,
    name: { contains: searchTerm, mode: 'insensitive' }
  }
});

// Date range
const orders = await prisma.order.findMany({
  where: {
    tenantId,
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }
});

// Aggregate sales
const salesReport = await prisma.orderItem.groupBy({
  by: ['productId'],
  where: {
    order: { tenantId, status: 'DELIVERED' }
  },
  _sum: { quantityKg: true, lineTotal: true },
  orderBy: { _sum: { lineTotal: 'desc' } }
});
```
