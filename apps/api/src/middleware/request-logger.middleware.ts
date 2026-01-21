/**
 * Request Logging Middleware
 * Logs all incoming requests and their duration
 */
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Logs request details and response time
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Skip logging for health checks (noisy)
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  const startTime = Date.now();
  req.startTime = startTime;

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.request(req.method, req.path, res.statusCode, duration);
  });

  next();
};
