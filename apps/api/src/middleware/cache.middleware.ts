/**
 * Cache Control Middleware
 * Adds Cache-Control headers to GET responses for browser/proxy caching
 */
import { Request, Response, NextFunction } from "express";

/**
 * Sets Cache-Control headers for GET requests
 * @param maxAge - Cache duration in seconds (default: 30s for dynamic data)
 */
export function cacheControl(maxAge: number = 30) {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (_req.method === "GET") {
      res.set(
        "Cache-Control",
        `private, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
      );
    } else {
      // Don't cache mutations
      res.set("Cache-Control", "no-store");
    }
    next();
  };
}
