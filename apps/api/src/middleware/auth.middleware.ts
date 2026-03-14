/**
 * Authentication Middleware
 * Validates JWT token from Supabase and sets user info on request
 */
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import { logger } from "../utils/logger";
import { verifyToken, isSupabaseConfigured } from "../config/supabase";
import { syncUserFromSupabase } from "../services/user-sync.service";

/**
 * Authenticates request using Bearer token
 * Validates with Supabase Auth and syncs user to local database
 * Sets req.userId and req.userEmail if valid
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw AppError.unauthorized("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw AppError.unauthorized("Token not provided");
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Development fallback: accept token as userId for testing
      if (process.env.NODE_ENV === "development") {
        req.userId = token;
        req.userEmail = `${token}@dev.local`;
        logger.debug(
          "Auth: Dev mode - Supabase not configured, using token as userId",
          {
            userId: token,
          },
        );
        return next();
      }
      throw AppError.internal("Authentication not configured");
    }

    // Verify token with Supabase
    const { user, error } = await verifyToken(token);

    if (error || !user) {
      logger.warn("Auth: Token verification failed", { error: error?.message });
      throw AppError.unauthorized("Invalid or expired token");
    }

    // Sync user to local database (creates if not exists)
    const localUser = await syncUserFromSupabase(user);

    // Set user context on request
    req.userId = localUser.id;
    req.userEmail = localUser.email;

    logger.debug("Auth: User authenticated", {
      userId: localUser.id,
      email: localUser.email,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public routes that behave differently when authenticated
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      return authenticate(req, res, next);
    }

    // No auth header - continue without user
    next();
  } catch {
    // Auth failed - continue without user (don't block request)
    next();
  }
};
