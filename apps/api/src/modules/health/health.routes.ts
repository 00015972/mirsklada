/**
 * Health Check Module
 * Provides endpoints for monitoring and load balancer health checks
 */
import { Router, Request, Response } from "express";
import { healthCheck as dbHealthCheck } from "@mirsklada/database";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: "connected" | "disconnected";
  };
}

/**
 * GET /health
 * Simple health check for load balancers (returns 200 if alive)
 */
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

/**
 * GET /health/detailed
 * Detailed health check including service dependencies
 */
router.get(
  "/detailed",
  asyncHandler(async (_req: Request, res: Response) => {
    const dbConnected = await dbHealthCheck();

    const health: HealthStatus = {
      status: dbConnected ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      uptime: process.uptime(),
      services: {
        database: dbConnected ? "connected" : "disconnected",
      },
    };

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  }),
);

/**
 * GET /health/ready
 * Readiness probe - returns 200 only when ready to accept traffic
 */
router.get(
  "/ready",
  asyncHandler(async (_req: Request, res: Response) => {
    const dbConnected = await dbHealthCheck();

    if (!dbConnected) {
      res.status(503).json({
        ready: false,
        reason: "Database not connected",
      });
      return;
    }

    res.status(200).json({ ready: true });
  }),
);

export const healthRouter: Router = router;
