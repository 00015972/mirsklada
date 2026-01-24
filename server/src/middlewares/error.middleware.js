/**
 * Global Error Handler Middleware
 * Handles all errors and sends consistent error responses
 */

const { ERROR_CODES } = require('../config/constants');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create specific error types
 */
const createError = {
  badRequest: (message, details = null) => 
    new ApiError(400, ERROR_CODES.VALIDATION_ERROR, message, details),
  
  unauthorized: (message = 'Authentication required') => 
    new ApiError(401, ERROR_CODES.AUTHENTICATION_ERROR, message),
  
  forbidden: (message = 'Access denied') => 
    new ApiError(403, ERROR_CODES.AUTHORIZATION_ERROR, message),
  
  notFound: (resource = 'Resource') => 
    new ApiError(404, ERROR_CODES.NOT_FOUND, `${resource} not found`),
  
  conflict: (message) => 
    new ApiError(409, ERROR_CODES.CONFLICT, message),
  
  insufficientStock: (productName, available, requested) => 
    new ApiError(400, ERROR_CODES.INSUFFICIENT_STOCK, 
      `Insufficient stock for ${productName}. Available: ${available}, Requested: ${requested}`,
      { productName, available, requested }
    ),
  
  internal: (message = 'Internal server error') => 
    new ApiError(500, ERROR_CODES.INTERNAL_ERROR, message),
};

/**
 * Error handler middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    statusCode: err.statusCode,
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: errors.map(e => ({
          field: e.path,
          message: e.msg,
        })),
      },
    });
  }

  // Handle Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: err.message || 'Database operation failed',
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Invalid token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        message: 'Token expired',
      },
    });
  }

  // Default to internal server error
  return res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  });
};

module.exports = errorMiddleware;
module.exports.ApiError = ApiError;
module.exports.createError = createError;
