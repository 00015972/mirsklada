// Zod validation schemas for Mirsklada
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// COMMON SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// Weight: always 2 decimal places, positive
export const weightSchema = z.number()
  .positive('Weight must be positive')
  .multipleOf(0.01, 'Weight must have at most 2 decimal places');

// Price: positive, 2 decimal places
export const priceSchema = z.number()
  .nonnegative('Price cannot be negative')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

// ═══════════════════════════════════════════════════════════════
// AUTH SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required').max(255),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// ═══════════════════════════════════════════════════════════════
// TENANT SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const createTenantSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string()
      .min(3, 'Slug must be at least 3 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  }),
});

// ═══════════════════════════════════════════════════════════════
// CATEGORY SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// ═══════════════════════════════════════════════════════════════
// PRODUCT SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
    categoryId: z.string().uuid().optional().nullable(),
    basePricePerKg: priceSchema,
    minStockKg: weightSchema.optional().default(0),
    unit: z.string().max(20).default('kg'),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    basePricePerKg: priceSchema.optional(),
    minStockKg: weightSchema.optional(),
    unit: z.string().max(20).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    active: z.coerce.boolean().optional(),
  }),
});

// ═══════════════════════════════════════════════════════════════
// STOCK SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const stockMovementTypeSchema = z.enum(['IN', 'OUT', 'ADJUST']);

export const createStockMovementSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    type: stockMovementTypeSchema,
    quantityKg: weightSchema,
    notes: z.string().max(500).optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    newQuantityKg: weightSchema,
    reason: z.string().min(1, 'Reason is required').max(500),
  }),
});

// ═══════════════════════════════════════════════════════════════
// CLIENT SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    contactPerson: z.string().max(255).optional(),
    phone: z.string().max(50).optional(),
    address: z.string().max(500).optional(),
    priceMatrixId: z.string().uuid().optional().nullable(),
    notes: z.string().max(1000).optional(),
  }),
});

export const updateClientSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    contactPerson: z.string().max(255).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    priceMatrixId: z.string().uuid().optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// ═══════════════════════════════════════════════════════════════
// ORDER SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'delivered',
  'cancelled',
]);

export const orderItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantityKg: weightSchema,
});

export const createOrderSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('Invalid client ID'),
    items: z.array(orderItemInputSchema).min(1, 'At least one item is required'),
    notes: z.string().max(1000).optional(),
    deliveryAddress: z.string().max(500).optional(),
    deliveryDate: z.coerce.date().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: orderStatusSchema,
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// ═══════════════════════════════════════════════════════════════
// PAYMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const paymentMethodSchema = z.enum(['cash', 'card', 'transfer', 'click', 'payme']);

export const createPaymentSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('Invalid client ID'),
    amount: priceSchema.positive('Amount must be positive'),
    method: paymentMethodSchema.optional(),
    reference: z.string().max(255).optional(),
    notes: z.string().max(500).optional(),
  }),
});

// ═══════════════════════════════════════════════════════════════
// PRICE MATRIX SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const priceMatrixItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  customPriceKg: priceSchema,
});

export const createPriceMatrixSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(500).optional(),
    items: z.array(priceMatrixItemInputSchema).optional(),
  }),
});

// ═══════════════════════════════════════════════════════════════
// INFERRED TYPES (for use in services/controllers)
// ═══════════════════════════════════════════════════════════════

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type CreateClientInput = z.infer<typeof createClientSchema>['body'];
export type UpdateClientInput = z.infer<typeof updateClientSchema>['body'];
export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>['body'];
export type CreatePriceMatrixInput = z.infer<typeof createPriceMatrixSchema>['body'];
