// Middleware exports
export { authenticate, optionalAuth } from "./auth.middleware";
export { resolveTenant, requireAdmin } from "./tenant.middleware";
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
} from "./validate.middleware";
export { errorHandler, notFoundHandler } from "./error.middleware";
export {
  defaultRateLimiter,
  strictRateLimiter,
  webhookRateLimiter,
} from "./rate-limit.middleware";
export {
  requireFeature,
  requirePro,
  type ProFeature,
} from "./subscription.middleware";
export { requestLogger } from "./request-logger.middleware";

// Re-export request types
export type {
  AuthenticatedRequest,
  TenantRequest,
} from "../types/request.types";
