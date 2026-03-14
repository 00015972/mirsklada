/**
 * Subscription Feature Gate Middleware
 * Restricts access to Pro-only features
 */
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";

/**
 * Features that require Pro subscription
 */
export type ProFeature =
  | "telegram_bots"
  | "google_drive"
  | "yandex_delivery"
  | "advanced_reports"
  | "price_matrices"
  | "api_access";

const PRO_FEATURES: ProFeature[] = [
  "telegram_bots",
  "google_drive",
  "yandex_delivery",
  "advanced_reports",
  "price_matrices",
  "api_access",
];

/**
 * Middleware factory that checks if tenant has access to a feature
 * @example
 * router.use('/integrations/google-drive', requireFeature('google_drive'));
 */
export const requireFeature = (feature: ProFeature) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // If feature is Pro-only and tenant is on Basic plan
    if (PRO_FEATURES.includes(feature) && req.subscriptionTier !== "pro") {
      throw AppError.forbidden(
        `The "${feature}" feature requires a Pro subscription. Please upgrade to access this feature.`,
        "FEATURE_REQUIRES_PRO",
      );
    }
    next();
  };
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
