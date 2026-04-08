/**
 * @file Middleware Module Exports
 * @description Central export point for all Express middleware functions.
 * Middleware is applied in the following order (see app.ts):
 * 1. Security: helmet, cors, rate limiting
 * 2. Body parsing: json, urlencoded
 * 3. Logging: requestLogger
 * 4. Authentication: authenticate/optionalAuth
 * 5. Tenant resolution: resolveTenant
 * 6. Route handlers
 * 7. Error handling: notFoundHandler, errorHandler
 *
 * @module apps/api/src/middleware
 *
 * @exports
 * - authenticate/optionalAuth: JWT token validation
 * - resolveTenant/requireAdmin: Multi-tenancy middleware
 * - validate*: Zod schema validation
 * - errorHandler/notFoundHandler: Error handling
 * - *RateLimiter: Rate limiting configurations
 * - requireFeature/requirePro: Subscription tier checks
 * - requestLogger: HTTP request logging
 * - cacheControl: Cache header management
 *
 * @connections
 * - Used by: ./app.ts (middleware registration)
 */

// ═══════════════════════════════════════════════════════════════════
// Authentication Middleware
// ═══════════════════════════════════════════════════════════════════
export { authenticate, optionalAuth } from "./auth.middleware";

// ═══════════════════════════════════════════════════════════════════
// Multi-Tenancy Middleware
// ═══════════════════════════════════════════════════════════════════
export { resolveTenant, requireAdmin } from "./tenant.middleware";

// ═══════════════════════════════════════════════════════════════════
// Validation Middleware (Zod Schemas)
// ═══════════════════════════════════════════════════════════════════
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
} from "./validate.middleware";

// ═══════════════════════════════════════════════════════════════════
// Error Handling Middleware
// ═══════════════════════════════════════════════════════════════════
export { errorHandler, notFoundHandler } from "./error.middleware";

// ═══════════════════════════════════════════════════════════════════
// Rate Limiting Middleware
// ═══════════════════════════════════════════════════════════════════
export {
  defaultRateLimiter,
  strictRateLimiter,
  webhookRateLimiter,
} from "./rate-limit.middleware";

// ═══════════════════════════════════════════════════════════════════
// Subscription/Feature Gating Middleware
// ═══════════════════════════════════════════════════════════════════
export {
  requireFeature,
  requirePro,
  type ProFeature,
} from "./subscription.middleware";

// ═══════════════════════════════════════════════════════════════════
// Request Logging Middleware
// ═══════════════════════════════════════════════════════════════════
export { requestLogger } from "./request-logger.middleware";

// ═══════════════════════════════════════════════════════════════════
// Caching Middleware
// ═══════════════════════════════════════════════════════════════════
export { cacheControl } from "./cache.middleware";

// ═══════════════════════════════════════════════════════════════════
// Request Type Re-exports
// ═══════════════════════════════════════════════════════════════════
export type {
  AuthenticatedRequest,
  TenantRequest,
} from "../types/request.types";
