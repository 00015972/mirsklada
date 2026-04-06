/**
 * Cache Control Middleware
 * Adds Cache-Control headers to GET responses for browser/proxy caching
 */
import { Request, Response, NextFunction } from "express";

/**
 * Sets Cache-Control headers for GET requests
 * @param maxAge - Cache duration in seconds. Use 0 to disable caching.
 */
export function cacheControl(maxAge: number = 0) {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Disable caching by default for authenticated API responses.
    if (maxAge <= 0) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Surrogate-Control", "no-store");
    } else if (_req.method === "GET") {
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
