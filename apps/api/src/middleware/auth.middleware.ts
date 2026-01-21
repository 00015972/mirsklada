/**
 * Authentication Middleware
 * Validates JWT token and sets user info on request
 *
 * TODO: Integrate with Supabase Auth or Clerk in Phase 1.2
 */
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import { logger } from "../utils/logger";

/**
 * Authenticates request using Bearer token
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

    // TODO: Replace with actual Supabase/Clerk token validation
    // For now, we'll use a placeholder that accepts any token in development
    if (process.env.NODE_ENV === "development") {
      // In development, accept a simple user ID as token for testing
      req.userId = token;
      req.userEmail = `${token}@dev.local`;
      logger.debug("Auth: Development mode - accepting token as userId", {
        userId: token,
      });
    } else {
      // In production, this will validate with Supabase
      // const { data: { user }, error } = await supabase.auth.getUser(token);
      // if (error || !user) throw AppError.unauthorized('Invalid token');
      // req.userId = user.id;
      // req.userEmail = user.email;
      throw AppError.internal("Auth not configured for production");
    }

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
