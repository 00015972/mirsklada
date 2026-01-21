/**
 * Rate Limiting Middleware
 * Protects API from abuse
 */
import rateLimit from "express-rate-limit";
import { AppError } from "../utils/app-error";
import { env } from "../config/env";

/**
 * Default rate limiter for all routes
 * 100 requests per minute by default
 */
export const defaultRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests("Too many requests, please try again later"));
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.userId || req.ip || "unknown";
  },
});

/**
 * Strict rate limiter for sensitive endpoints (login, register)
 * 10 requests per minute
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests("Too many attempts, please try again later"));
  },
});

/**
 * Very strict rate limiter for webhook endpoints
 * 30 requests per minute
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
});
