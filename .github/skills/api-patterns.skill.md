# Express API Patterns for Mirsklada

## Project Structure

```
apps/api/src/
├── config/
│   ├── database.ts
│   ├── env.ts              # Environment validation with Zod
│   └── swagger.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── tenant.middleware.ts
│   ├── subscription.middleware.ts
│   ├── validate.middleware.ts
│   ├── error.middleware.ts
│   └── rate-limit.middleware.ts
├── modules/
│   └── [module]/
│       ├── [module].controller.ts
│       ├── [module].service.ts
│       ├── [module].routes.ts
│       └── [module].test.ts
├── services/               # External integrations
│   ├── google-drive/
│   └── payments/
├── utils/
│   ├── app-error.ts
│   ├── async-handler.ts
│   ├── weight.ts
│   └── currency.ts
└── app.ts
```

## Environment Configuration

```typescript
// apps/api/src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000").transform(Number),
  DATABASE_URL: z.string().url(),

  // Auth
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // External APIs
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

## Custom Request Type

```typescript
// apps/api/src/types/express.d.ts
import { User } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenantId?: string;
      subscriptionTier?: "basic" | "pro";
    }
  }
}

// Or create a custom type
export interface AuthRequest extends Request {
  user: User;
  tenantId: string;
  subscriptionTier: "basic" | "pro";
}
```

## Middleware Patterns

### Authentication Middleware

```typescript
// apps/api/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { supabase } from "@/config/supabase";
import { AppError } from "@/utils/app-error";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Missing authorization header", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError("Invalid or expired token", 401, "UNAUTHORIZED");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
```

### Tenant Middleware

```typescript
// apps/api/src/middleware/tenant.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "@/types";
import { prisma } from "@mirsklada/database";
import { AppError } from "@/utils/app-error";

export const resolveTenant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get tenant from header or user's default tenant
    const tenantId = req.headers["x-tenant-id"] as string;

    if (!tenantId) {
      throw new AppError("Tenant ID required", 400, "TENANT_REQUIRED");
    }

    // Verify user has access to this tenant
    const membership = await prisma.tenantMember.findFirst({
      where: {
        userId: req.user.id,
        tenantId,
        status: "active",
      },
      include: {
        tenant: true,
      },
    });

    if (!membership) {
      throw new AppError(
        "Access denied to this tenant",
        403,
        "TENANT_ACCESS_DENIED",
      );
    }

    req.tenantId = tenantId;
    req.subscriptionTier = membership.tenant.subscriptionTier;

    next();
  } catch (error) {
    next(error);
  }
};
```

### Subscription Feature Gate

```typescript
// apps/api/src/middleware/subscription.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "@/types";
import { AppError } from "@/utils/app-error";

type Feature = "yandex_delivery" | "google_drive";

const PRO_FEATURES: Feature[] = ["yandex_delivery", "google_drive"];

export const requireFeature = (feature: Feature) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (PRO_FEATURES.includes(feature) && req.subscriptionTier !== "pro") {
      throw new AppError(
        "This feature requires a Pro subscription",
        403,
        "FEATURE_REQUIRES_PRO",
      );
    }
    next();
  };
};
```

### Validation Middleware

```typescript
// apps/api/src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "@/utils/app-error";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`,
        );
        next(new AppError(messages.join(", "), 400, "VALIDATION_ERROR"));
      } else {
        next(error);
      }
    }
  };
};
```

## Controller Patterns

```typescript
// apps/api/src/modules/products/product.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "@/types";
import { productService } from "./product.service";
import { asyncHandler } from "@/utils/async-handler";

export const productController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const products = await productService.findAll(req.tenantId);

    res.json({
      success: true,
      data: products,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const product = await productService.findById(req.tenantId, id);

    res.json({
      success: true,
      data: product,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await productService.create(req.tenantId, req.body);

    res.status(201).json({
      success: true,
      data: product,
      message: "product.created", // i18n key
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const product = await productService.update(req.tenantId, id, req.body);

    res.json({
      success: true,
      data: product,
      message: "product.updated",
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await productService.delete(req.tenantId, id);

    res.json({
      success: true,
      message: "product.deleted",
    });
  }),
};
```

## Route Patterns

```typescript
// apps/api/src/modules/products/product.routes.ts
import { Router } from "express";
import { productController } from "./product.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { resolveTenant } from "@/middleware/tenant.middleware";
import { validate } from "@/middleware/validate.middleware";
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
} from "@mirsklada/shared";

const router = Router();

// All routes require auth and tenant
router.use(authenticate, resolveTenant);

router.get("/", productController.getAll);

router.get("/:id", validate(productIdParamSchema), productController.getById);

router.post("/", validate(createProductSchema), productController.create);

router.patch("/:id", validate(updateProductSchema), productController.update);

router.delete("/:id", validate(productIdParamSchema), productController.delete);

export { router as productRoutes };
```

## Error Handling

```typescript
// apps/api/src/utils/app-error.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public isOperational: boolean = true,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// apps/api/src/utils/async-handler.ts
import { Request, Response, NextFunction } from "express";

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// apps/api/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/app-error";
import { env } from "@/config/env";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Log unexpected errors
  console.error("Unexpected error:", err);

  // Don't leak error details in production
  const message =
    env.NODE_ENV === "production" ? "Internal server error" : err.message;

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
  });
};
```

## Utility Functions

```typescript
// apps/api/src/utils/weight.ts
import Decimal from "decimal.js";

/**
 * Round weight to 2 decimal places
 */
export function roundWeight(kg: number | Decimal): Decimal {
  return new Decimal(kg).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Format weight for display
 */
export function formatWeight(kg: number | Decimal): string {
  return `${roundWeight(kg).toFixed(2)} kg`;
}

/**
 * Calculate line total (weight × price)
 */
export function calculateLineTotal(
  quantityKg: number | Decimal,
  pricePerKg: number | Decimal,
): Decimal {
  const qty = new Decimal(quantityKg);
  const price = new Decimal(pricePerKg);
  return qty.times(price).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

// apps/api/src/utils/currency.ts
/**
 * Format UZS currency with thousand separators
 */
export function formatUZS(amount: number | bigint): string {
  return (
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount)) + " UZS"
  );
}
```

## App Entry Point

```typescript
// apps/api/src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error.middleware";
import { rateLimiter } from "@/middleware/rate-limit.middleware";

// Routes
import { authRoutes } from "@/modules/auth/auth.routes";
import { tenantRoutes } from "@/modules/tenants/tenant.routes";
import { productRoutes } from "@/modules/products/product.routes";
import { clientRoutes } from "@/modules/clients/client.routes";
import { orderRoutes } from "@/modules/orders/order.routes";
import { stockRoutes } from "@/modules/stock/stock.routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: "10kb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tenants", tenantRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/stock", stockRoutes);

// Error handling (must be last)
app.use(errorHandler);

export { app };
```

## Response Format Standard

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "message": "i18n.key" // optional
}

// Success with pagination
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

// Error response
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID xyz not found"
  }
}
```
