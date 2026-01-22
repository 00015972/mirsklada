/**
 * API Server Entry Point
 * Starts the Express server with graceful shutdown
 */
import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { disconnect } from "@mirsklada/database";

// Create Express app
const app = createApp();

// Start server
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Mirsklada API running on http://localhost:${env.PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Health check: http://localhost:${env.PORT}/health`);
});

// ─────────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────────

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // Disconnect from database
      await disconnect();
      logger.info("Database connection closed");

      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", { error });
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason });
  shutdown("unhandledRejection");
});

export { app };
