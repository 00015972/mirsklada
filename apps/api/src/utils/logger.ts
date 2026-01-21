/**
 * Simple Logger Utility
 * In production, consider using Winston or Pino
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const LOG_COLORS = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  reset: "\x1b[0m",
};

const formatLog = (entry: LogEntry): string => {
  const color = LOG_COLORS[entry.level];
  const reset = LOG_COLORS.reset;
  const levelUpper = entry.level.toUpperCase().padEnd(5);

  let output = `${color}[${entry.timestamp}] ${levelUpper}${reset} ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${JSON.stringify(entry.context)}`;
  }

  return output;
};

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

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.log(formatLog(createLogEntry("debug", message, context)));
    }
  },

  info(message: string, context?: Record<string, unknown>) {
    console.log(formatLog(createLogEntry("info", message, context)));
  },

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(formatLog(createLogEntry("warn", message, context)));
  },

  error(message: string, context?: Record<string, unknown>) {
    console.error(formatLog(createLogEntry("error", message, context)));
  },

  /**
   * Log HTTP request (for request logging middleware)
   */
  request(method: string, url: string, statusCode: number, duration: number) {
    const level: LogLevel =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    this[level](`${method} ${url} ${statusCode}`, {
      duration: `${duration}ms`,
    });
  },
};
