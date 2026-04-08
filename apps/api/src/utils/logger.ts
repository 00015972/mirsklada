/**
 * @file Logger Utility
 * @description Provides structured logging with colored console output for development
 * and JSON-ready format for production. Supports multiple log levels and contextual data.
 *
 * @module apps/api/src/utils/logger
 *
 * @connections
 * - Used by: All modules for logging
 * - Exported via: ./index.ts
 * - Used by: ./middleware/request-logger.middleware.ts (HTTP request logging)
 *
 * @log_levels
 * - debug: Development-only detailed logging (hidden in production)
 * - info: General information about application state
 * - warn: Warning conditions that should be addressed
 * - error: Error conditions that affect functionality
 *
 * @usage
 * ```typescript
 * import { logger } from '@/utils';
 *
 * logger.info('Server started', { port: 3001 });
 * logger.warn('Deprecated endpoint called', { endpoint: '/api/old' });
 * logger.error('Database connection failed', { error: err.message });
 * logger.debug('Processing item', { itemId: '123' }); // Only in development
 * ```
 *
 * @future Consider migrating to Winston or Pino for:
 * - File transport (writing logs to files)
 * - Log rotation
 * - Structured JSON output for log aggregation (DataDog, ELK, etc.)
 */

/**
 * Available log levels
 */
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structure of a log entry
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * ANSI color codes for terminal output
 * @description Provides colored output in development for easy log scanning
 */
const LOG_COLORS = {
  debug: "\x1b[36m", // Cyan - low priority, development info
  info: "\x1b[32m", // Green - normal operations
  warn: "\x1b[33m", // Yellow - attention needed
  error: "\x1b[31m", // Red - problems
  reset: "\x1b[0m", // Reset to default
};

/**
 * Format a log entry for console output
 * @description Creates a human-readable log line with color coding
 *
 * @param {LogEntry} entry - Log entry to format
 * @returns {string} Formatted log string
 *
 * @example
 * // Output: [2024-01-15T10:30:00.000Z] INFO  Server started {"port":3001}
 */
const formatLog = (entry: LogEntry): string => {
  const color = LOG_COLORS[entry.level];
  const reset = LOG_COLORS.reset;
  const levelUpper = entry.level.toUpperCase().padEnd(5);

  let output = `${color}[${entry.timestamp}] ${levelUpper}${reset} ${entry.message}`;

  // Append context as JSON if provided
  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${JSON.stringify(entry.context)}`;
  }

  return output;
};

/**
 * Create a log entry object
 * @description Factory function to create consistent log entry structures
 *
 * @param {LogLevel} level - Severity level
 * @param {string} message - Log message
 * @param {Record<string, unknown>} context - Optional contextual data
 * @returns {LogEntry} Structured log entry
 */
const createLogEntry = (
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  context,
});

/**
 * Logger Object
 * @description Main logger interface with methods for each log level
 */
export const logger = {
  /**
   * Debug level logging
   * @description Only outputs in non-production environments.
   * Use for detailed debugging information during development.
   *
   * @param {string} message - Debug message
   * @param {Record<string, unknown>} context - Optional contextual data
   */
  debug(message: string, context?: Record<string, unknown>) {
    // Suppress debug logs in production for performance
    if (process.env.NODE_ENV !== "production") {
      console.log(formatLog(createLogEntry("debug", message, context)));
    }
  },

  /**
   * Info level logging
   * @description Use for general operational information.
   * Always outputs regardless of environment.
   *
   * @param {string} message - Info message
   * @param {Record<string, unknown>} context - Optional contextual data
   */
  info(message: string, context?: Record<string, unknown>) {
    console.log(formatLog(createLogEntry("info", message, context)));
  },

  /**
   * Warning level logging
   * @description Use for potentially problematic situations.
   * Something is wrong but the application can continue.
   *
   * @param {string} message - Warning message
   * @param {Record<string, unknown>} context - Optional contextual data
   */
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(formatLog(createLogEntry("warn", message, context)));
  },

  /**
   * Error level logging
   * @description Use for error conditions that affect functionality.
   * These should be investigated and fixed.
   *
   * @param {string} message - Error message
   * @param {Record<string, unknown>} context - Optional contextual data (include error.message, stack)
   */
  error(message: string, context?: Record<string, unknown>) {
    console.error(formatLog(createLogEntry("error", message, context)));
  },

  /**
   * HTTP Request Logging
   * @description Specialized method for logging HTTP requests.
   * Automatically selects log level based on response status code.
   *
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} url - Request URL path
   * @param {number} statusCode - Response status code
   * @param {number} duration - Request duration in milliseconds
   *
   * @log_levels
   * - 5xx errors → error level
   * - 4xx errors → warn level
   * - 2xx/3xx success → info level
   */
  request(method: string, url: string, statusCode: number, duration: number) {
    const level: LogLevel =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    this[level](`${method} ${url} ${statusCode}`, {
      duration: `${duration}ms`,
    });
  },
};
