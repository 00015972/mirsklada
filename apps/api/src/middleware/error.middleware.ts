/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent JSON responses
 */
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import { logger } from "../utils/logger";
import { env } from "../config/env";

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    stack?: string;
    details?: unknown;
  };
}

/**
 * Global error handler - must be registered last in middleware chain
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Default error values
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  let isOperational = false;

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error(`${req.method} ${req.path} - ${message}`, {
      code,
      statusCode,
      stack: err.stack,
      userId: req.userId,
      tenantId: req.tenantId,
    });
  } else {
    logger.warn(`${req.method} ${req.path} - ${message}`, {
      code,
      statusCode,
    });
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode,
    },
  };

  // Include stack trace in development
  if (env.NODE_ENV === "development") {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler for unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(AppError.notFound(`Route ${req.method} ${req.path} not found`));
};
