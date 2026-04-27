/**
 * Subscription Feature Gate Middleware
 * Restricts access to Pro-only features
 */
import { Request, Response, NextFunction } from "express";
import { TIER_LIMITS } from "@mirsklada/shared";
import { AppError } from "../utils/app-error";

/**
 * Features that require Pro subscription
 */
export type ProFeature =
  | "google_drive"
  | "yandex_delivery"
  | "reports_advanced"
  | "reports_export"
  | "price_matrices";

const BASIC_FEATURES = new Set<string>(TIER_LIMITS.basic.features);
const PRO_FEATURES = new Set<string>(
  TIER_LIMITS.pro.features.filter((feature) => !BASIC_FEATURES.has(feature)),
);

/**
 * Middleware factory that checks if tenant has access to a feature
 * @example
 * router.use('/integrations/google-drive', requireFeature('google_drive'));
 */
export const requireFeature = (feature: ProFeature) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // If feature is Pro-only and tenant is on Basic plan
    if (PRO_FEATURES.has(feature) && req.subscriptionTier !== "pro") {
      throw AppError.forbidden(
        `The "${feature}" feature requires a Pro subscription. Please upgrade to access this feature.`,
        "FEATURE_REQUIRES_PRO",
      );
    }
    next();
  };
};

/**
 * Middleware that restricts an endpoint to admin role only.
 * Staff will receive 403 Forbidden.
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.userRole !== "admin") {
    throw AppError.forbidden(
      "This action requires admin privileges.",
      "REQUIRES_ADMIN",
    );
  }
  next();
};

/**
 * Middleware to check if tenant is on Pro plan
 */
export const requirePro = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.subscriptionTier !== "pro") {
    throw AppError.forbidden(
      "This endpoint requires a Pro subscription",
      "REQUIRES_PRO",
    );
  }
  next();
};
