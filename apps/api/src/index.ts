/**
 * @file API Server Entry Point
 * @description This is the main entry point for the Mirsklada API server.
 * It initializes the Express application, starts the HTTP server, and sets up
 * graceful shutdown handling for all termination signals and error scenarios.
 *
 * @module apps/api/src/index
 *
 * @connections
 * - Imports: ./app (Express app factory), ./config/env (environment config), ./utils/logger (Winston logger)
 * - Uses: @mirsklada/database (Prisma client disconnect)
 * - This file is the entry point called when running `npm start` or `npm run dev`
 *
 * @responsibilities
 * 1. Create and configure the Express application via createApp()
 * 2. Start HTTP server on configured host/port (0.0.0.0:PORT)
 * 3. Handle graceful shutdown on SIGTERM/SIGINT signals
 * 4. Handle uncaught exceptions and unhandled promise rejections
 * 5. Ensure database connections are properly closed on shutdown
 *
 * @environment
 * - PORT: Server port (default: 3001)
 * - NODE_ENV: Environment mode (development/production)
 */
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { disconnect } from "@mirsklada/database";

/**
 * Express Application Instance
 * @description Creates the fully configured Express application using the factory function.
 * The app includes all middleware, routes, and error handlers defined in ./app.ts
 */
const app = createApp();

/**
 * Server Host Configuration
 * @description Using 0.0.0.0 allows the server to accept connections from any IP address,
 * which is required for Docker containers and external access scenarios.
 */
const HOST = "0.0.0.0";

/**
 * HTTP Server Instance
 * @description Creates and starts the Express HTTP server.
 * Logs startup information including host, port, environment, and health check URL.
 * The server instance is stored to enable graceful shutdown later.
 */
const server = app.listen(env.PORT, HOST, () => {
  logger.info(`Mirsklada API running on http://${HOST}:${env.PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Health check: http://${HOST}:${env.PORT}/health`);
});

/**
 * Graceful Shutdown Handler
 * @description Handles graceful shutdown of the server when receiving termination signals.
 * This ensures:
 * - Current HTTP requests are completed before shutdown
 * - Database connections (Prisma) are properly disconnected
 * - All resources are released cleanly
 *
 * @param {string} signal - The signal that triggered shutdown (SIGTERM, SIGINT, etc.)
 *
 * @flow
 * 1. Stop accepting new HTTP connections
 * 2. Wait for existing connections to complete
 * 3. Disconnect from PostgreSQL database via Prisma
 * 4. Exit process with appropriate code
 *
 * @timeout Forces shutdown after 10 seconds to prevent hanging
 */
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections - allows existing requests to complete
  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // Disconnect from database - releases connection pool
      await disconnect();
      logger.info("Database connection closed");

      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", { error });
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if graceful shutdown hangs
  // This prevents zombie processes in production environments
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

/**
 * Process Signal Handlers
 * @description Registers handlers for OS-level termination signals:
 * - SIGTERM: Sent by process managers (Docker, PM2, Kubernetes) for graceful stop
 * - SIGINT: Sent by Ctrl+C in terminal (interactive interrupt)
 */
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/**
 * Uncaught Exception Handler
 * @description Catches synchronous errors that weren't caught by try/catch blocks.
 * Logs the error details and initiates graceful shutdown to prevent undefined behavior.
 *
 * @warning This indicates a programming error that should be fixed
 */
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  shutdown("uncaughtException");
});

/**
 * Unhandled Promise Rejection Handler
 * @description Catches promise rejections that weren't handled with .catch() or try/catch.
 * Logs the rejection reason and initiates graceful shutdown.
 *
 * @warning This indicates a missing error handler in async code
 */
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason });
  shutdown("unhandledRejection");
});

/**
 * Export Express App
 * @description Exports the app instance for testing purposes.
 * Allows integration tests to import the app without starting the server.
 */
export { app };
