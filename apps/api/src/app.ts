/**
 * Express Application
 * Main app configuration with all middleware
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
} from "./middleware";
import {
  healthRouter,
  authRouter,
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
 * Creates and configures the Express application
 */
export function createApp(): Express {
  const app = express();

  // ─────────────────────────────────────────────────────────────────
  // Security Middleware
  // ─────────────────────────────────────────────────────────────────

  // Helmet sets various HTTP headers for security
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
    }),
  );

  // Rate limiting
  app.use(defaultRateLimiter);

  // ─────────────────────────────────────────────────────────────────
  // Body Parsing
  // ─────────────────────────────────────────────────────────────────

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ─────────────────────────────────────────────────────────────────
  // Request Logging
  // ─────────────────────────────────────────────────────────────────

  app.use(requestLogger);

  // ─────────────────────────────────────────────────────────────────
  // Routes
  // ─────────────────────────────────────────────────────────────────

  // Health checks (no auth required)
  app.use("/health", healthRouter);
  app.use("/api/health", healthRouter);

  // API v1 routes (protected with auth + tenant middleware)
  const apiV1 = express.Router();

  // Auth routes FIRST (public - no auth required)
  apiV1.use("/auth", authRouter);

  // Tenant routes (require auth but NOT tenant resolution)
  const tenantRouter = express.Router();
  tenantRouter.use(authenticate);
  tenantRouter.use("/tenants", tenantRoutes);
  apiV1.use(tenantRouter);

  // Protected routes (require auth + tenant)
  const protectedRoutes = express.Router();
  protectedRoutes.use(authenticate);
  protectedRoutes.use(resolveTenant);

  protectedRoutes.use("/categories", categoryRouter);
  protectedRoutes.use("/products", productRouter);
  protectedRoutes.use("/clients", clientRouter);
  protectedRoutes.use("/stock", stockRouter);
  protectedRoutes.use("/orders", orderRouter);
  protectedRoutes.use("/payments", paymentRouter);
  protectedRoutes.use("/dashboard", dashboardRouter);

  apiV1.use(protectedRoutes);

  app.use("/api/v1", apiV1);

  // Root route
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

  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  logger.info("Express app configured");

  return app;
}
