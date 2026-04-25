/**
 * @file Module Exports
 * @description Central export point for all API route modules.
 * Each module follows a consistent structure:
 * - index.ts: Exports the router
 * - *.schemas.ts: Zod validation schemas
 * - *.service.ts: Business logic
 * - *.controller.ts: HTTP request handlers
 * - *.routes.ts: Express router configuration
 *
 * @module apps/api/src/modules
 *
 * @exports
 * - healthRouter: Server health check endpoints
 * - authRouter: Authentication (login, signup, logout)
 * - tenantRoutes: Multi-tenant workspace management
 * - categoryRouter: Product category CRUD
 * - productRouter: Product catalog CRUD
 * - clientRouter: Business client management
 * - stockRouter: Inventory/stock management
 * - orderRouter: Sales order workflow
 * - paymentRouter: Payment recording and debt management
 * - dashboardRouter: Analytics and reporting
 * - billingRouter: Subscription and billing webhooks
 *
 * @connections
 * - Used by: ./app.ts (route mounting)
 */

// ═══════════════════════════════════════════════════════════════════
// Health Check Module
// ═══════════════════════════════════════════════════════════════════
export { healthRouter } from "./health";

// ═══════════════════════════════════════════════════════════════════
// Authentication Module
// ═══════════════════════════════════════════════════════════════════
export { authRouter } from "./auth";
export { billingRouter } from "./billing";

// ═══════════════════════════════════════════════════════════════════
// Multi-Tenancy Module
// ═══════════════════════════════════════════════════════════════════
export { tenantRoutes } from "./tenants";

// ═══════════════════════════════════════════════════════════════════
// Product Catalog Modules
// ═══════════════════════════════════════════════════════════════════
export { categoryRouter } from "./categories";
export { productRouter } from "./products";

// ═══════════════════════════════════════════════════════════════════
// Inventory Module
// ═══════════════════════════════════════════════════════════════════
export { stockRouter } from "./stock";

// ═══════════════════════════════════════════════════════════════════
// Client Management Module
// ═══════════════════════════════════════════════════════════════════
export { clientRouter } from "./clients";

// ═══════════════════════════════════════════════════════════════════
// Order & Payment Modules
// ═══════════════════════════════════════════════════════════════════
export { orderRouter } from "./orders";
export { paymentRouter } from "./payments";

// ═══════════════════════════════════════════════════════════════════
// Analytics Module
// ═══════════════════════════════════════════════════════════════════
export { dashboardRouter } from "./dashboard";
