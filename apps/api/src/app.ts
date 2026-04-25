/**
 * @file Express Application Configuration
 * @description Main Express application factory that configures all middleware,
 * routes, and error handlers for the Mirsklada API server.
 *
 * @module apps/api/src/app
 *
 * @connections
 * - Imports:
 *   - ./config/env (environment configuration)
 *   - ./middleware/* (all middleware functions)
 *   - ./modules/* (all route modules)
 *   - ./utils/logger (Winston logger)
 * - Exports: createApp() factory function
 * - Used by: ./index.ts (server entry point)
 *
 * @middleware_order (Critical - must be maintained)
 * 1. Trust proxy (for Railway/Docker)
 * 2. Security (Helmet, CORS)
 * 3. Rate limiting
 * 4. Body parsing (JSON, URL-encoded)
 * 5. Request logging
 * 6. Routes (with auth/tenant middleware per route group)
 * 7. 404 handler
 * 8. Global error handler (must be last)
 *
 * @route_groups
 * - Public: /health, /api/health (no auth)
 * - Auth: /api/v1/auth (no auth required, handles login/signup)
 * - Tenant Management: /api/v1/tenants (auth required, no tenant context)
 * - Protected: /api/v1/* (auth + tenant required for all business operations)
 */
import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import {
  requestLogger,
  defaultRateLimiter,
  errorHandler,
  notFoundHandler,
  authenticate,
  resolveTenant,
  cacheControl,
} from "./middleware";
import {
  healthRouter,
  authRouter,
  billingRouter,
  tenantRoutes,
  categoryRouter,
  productRouter,
  clientRouter,
  stockRouter,
  orderRouter,
  paymentRouter,
  dashboardRouter,
} from "./modules";
import { logger } from "./utils/logger";

/**
 * Express Application Factory
 * @description Creates and configures a fully initialized Express application
 * with all middleware, routes, and error handlers.
 *
 * @returns {Express} Configured Express application instance
 *
 * @usage
 * ```typescript
 * const app = createApp();
 * app.listen(3001);
 * ```
 */
export function createApp(): Express {
  const app = express();

  /**
   * Trust Proxy Setting
   * @description Required when running behind reverse proxies (Railway, Nginx, Docker).
   * Enables correct client IP detection for rate limiting, logging, and security headers.
   * Value of 1 means trust the first proxy in the chain.
   */
  app.set("trust proxy", 1);

  // ─────────────────────────────────────────────────────────────────
  // Security Middleware
  // ─────────────────────────────────────────────────────────────────

  /**
   * Helmet Security Headers
   * @description Sets various HTTP headers to protect against common vulnerabilities:
   * - Content-Security-Policy, X-Frame-Options, X-XSS-Protection, etc.
   */
  app.use(helmet());

  /**
   * CORS Configuration
   * @description Cross-Origin Resource Sharing settings allow the web frontend
   * to make API requests from different origins (domains).
   * - origin: Whitelist of allowed origins from CORS_ORIGIN env var
   * - credentials: Allows cookies/auth headers to be sent
   * - x-tenant-id: Custom header for multi-tenant workspace selection
   */
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
    }),
  );

  /**
   * Rate Limiting
   * @description Protects against brute force and DDoS attacks by limiting
   * requests per IP address. Configured in ./middleware/rate-limit.middleware.ts
   */
  app.use(defaultRateLimiter);

  // ─────────────────────────────────────────────────────────────────
  // Body Parsing
  // ─────────────────────────────────────────────────────────────────

  /**
   * JSON Body Parser
   * @description Parses incoming JSON request bodies. Limit of 10mb allows
   * for large product catalogs or batch operations.
   */
  app.use(express.json({ limit: "10mb" }));

  /**
   * URL-Encoded Body Parser
   * @description Parses form submissions. Extended mode allows nested objects.
   */
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ─────────────────────────────────────────────────────────────────
  // Request Logging
  // ─────────────────────────────────────────────────────────────────

  /**
   * Request Logger Middleware
   * @description Logs all incoming requests with method, path, and response time.
   * Uses Winston logger for structured logging. See ./middleware/request-logger.middleware.ts
   */
  app.use(requestLogger);

  // ─────────────────────────────────────────────────────────────────
  // Routes
  // ─────────────────────────────────────────────────────────────────

  /**
   * Health Check Routes (Public)
   * @description Endpoints for load balancers and monitoring systems.
   * Returns server health status, database connectivity, etc.
   * Available at both /health and /api/health for flexibility.
   */
  app.use("/health", healthRouter);
  app.use("/api/health", healthRouter);

  /**
   * API Version 1 Router
   * @description Groups all v1 API routes under /api/v1 prefix.
   * Allows for future API versioning (v2, v3, etc.)
   */
  const apiV1 = express.Router();

  /**
   * Authentication Routes (Public)
   * @description Login, signup, logout, token refresh endpoints.
   * Must be before auth middleware - these routes are unauthenticated.
   * @route POST /api/v1/auth/signup
   * @route POST /api/v1/auth/signin
   * @route POST /api/v1/auth/signout
   * @route POST /api/v1/auth/refresh
   * @route GET /api/v1/auth/me
   */
  apiV1.use("/auth", authRouter);

  /**
   * Billing Webhook Routes (Public, Signature-Protected)
   * @description Receives subscription lifecycle events from billing providers.
   * Authentication is handled by provider webhook signatures/secrets.
   * @route POST /api/v1/billing/revenuecat/webhook
   */
  apiV1.use("/billing", billingRouter);

  /**
   * Tenant Management Routes (Auth Required, No Tenant Context)
   * @description Routes for creating and managing workspaces/tenants.
   * Requires authentication but NOT tenant resolution since these routes
   * operate across tenants (e.g., creating a new tenant, listing user's tenants).
   * @route GET /api/v1/tenants - List user's tenants
   * @route POST /api/v1/tenants - Create new tenant
   * @route PATCH /api/v1/tenants/:id - Update tenant
   * @route POST /api/v1/tenants/:id/invite - Invite user to tenant
   */
  apiV1.use("/tenants", authenticate, tenantRoutes);

  /**
   * Protected Business Routes (Auth + Tenant Required)
   * @description All business logic routes that require both:
   * 1. authenticate: Valid JWT token in Authorization header
   * 2. resolveTenant: Valid x-tenant-id header pointing to user's tenant
   *
   * These routes operate within a specific tenant context - all data
   * is automatically scoped to the current tenant via Prisma middleware.
   *
   * @middleware
   * - authenticate: Validates JWT, sets req.userId
   * - resolveTenant: Validates tenant access, sets req.tenantId
   * - cacheControl(0): Disables caching for fresh data
   */
  const protectedRoutes = express.Router();
  protectedRoutes.use(authenticate);
  protectedRoutes.use(resolveTenant);

  /**
   * Category Routes - Manage product categories
   * @route GET /api/v1/categories
   * @route POST /api/v1/categories
   * @route PATCH /api/v1/categories/:id
   * @route DELETE /api/v1/categories/:id
   */
  protectedRoutes.use("/categories", cacheControl(0), categoryRouter);

  /**
   * Product Routes - Manage product catalog
   * @route GET /api/v1/products
   * @route GET /api/v1/products/:id
   * @route POST /api/v1/products
   * @route PATCH /api/v1/products/:id
   * @route DELETE /api/v1/products/:id
   */
  protectedRoutes.use("/products", cacheControl(0), productRouter);

  /**
   * Client Routes - Manage business clients
   * @route GET /api/v1/clients
   * @route GET /api/v1/clients/:id
   * @route POST /api/v1/clients
   * @route PATCH /api/v1/clients/:id
   * @route DELETE /api/v1/clients/:id
   */
  protectedRoutes.use("/clients", cacheControl(0), clientRouter);

  /**
   * Stock Routes - Manage inventory/stock levels
   * @route GET /api/v1/stock
   * @route GET /api/v1/stock/:productId
   * @route POST /api/v1/stock (add/adjust stock)
   */
  protectedRoutes.use("/stock", cacheControl(0), stockRouter);

  /**
   * Order Routes - Manage sales orders
   * @route GET /api/v1/orders
   * @route GET /api/v1/orders/:id
   * @route POST /api/v1/orders (create draft)
   * @route POST /api/v1/orders/:id/confirm (confirm order, deduct stock)
   * @route POST /api/v1/orders/:id/complete
   * @route POST /api/v1/orders/:id/cancel
   */
  protectedRoutes.use("/orders", cacheControl(0), orderRouter);

  /**
   * Payment Routes - Record payments and manage debt
   * @route GET /api/v1/payments
   * @route GET /api/v1/payments/client/:clientId
   * @route POST /api/v1/payments (record payment)
   * @route POST /api/v1/payments/:id/void (void payment)
   */
  protectedRoutes.use("/payments", cacheControl(0), paymentRouter);

  /**
   * Dashboard Routes - Analytics and reporting
   * @route GET /api/v1/dashboard/summary
   * @route GET /api/v1/dashboard/sales-trends
   * @route GET /api/v1/dashboard/top-products
   * @route GET /api/v1/dashboard/client-debts
   */
  protectedRoutes.use("/dashboard", cacheControl(0), dashboardRouter);

  apiV1.use(protectedRoutes);

  /**
   * Mount API v1 Routes
   * @description All v1 routes are prefixed with /api/v1
   */
  app.use("/api/v1", apiV1);

  /**
   * Root Route
   * @description Returns basic API information and version.
   * Useful for quick health checks and API discovery.
   */
  app.get("/", (_req, res) => {
    res.json({
      name: "Mirsklada API",
      version: process.env.npm_package_version || "0.1.0",
      docs: "/api/docs", // Future: Swagger docs
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Error Handling (must be last)
  // ─────────────────────────────────────────────────────────────────

  /**
   * 404 Not Found Handler
   * @description Catches requests to undefined routes and returns
   * a standardized 404 error response. Must be before errorHandler.
   */
  app.use(notFoundHandler);

  /**
   * Global Error Handler
   * @description Catches all errors thrown in routes and middleware.
   * Converts errors to standardized JSON response format.
   * Must be the LAST middleware registered.
   * See ./middleware/error.middleware.ts for implementation.
   */
  app.use(errorHandler);

  logger.info("Express app configured");

  return app;
}
