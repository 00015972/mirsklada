/**
 * @file Custom Application Error Class
 * @description Provides a standardized error class for handling operational errors
 * throughout the API. All intentional errors (validation, authentication, not found, etc.)
 * should use this class for consistent error response formatting.
 *
 * @module apps/api/src/utils/app-error
 *
 * @connections
 * - Used by: All service and controller files for error throwing
 * - Handled by: ./middleware/error.middleware.ts (global error handler)
 * - Exported via: ./index.ts
 *
 * @usage
 * ```typescript
 * // Using factory methods (recommended)
 * throw AppError.notFound('Product not found');
 * throw AppError.badRequest('Invalid quantity', 'INVALID_QUANTITY');
 *
 * // Using constructor directly
 * throw new AppError('Custom error', 400, 'CUSTOM_CODE');
 * ```
 *
 * @error_codes
 * Standard HTTP-based codes are used:
 * - BAD_REQUEST (400): Invalid input data
 * - UNAUTHORIZED (401): Missing or invalid authentication
 * - FORBIDDEN (403): Authenticated but not authorized
 * - NOT_FOUND (404): Resource doesn't exist
 * - CONFLICT (409): Conflicting operation (duplicate, etc.)
 * - RATE_LIMITED (429): Too many requests
 * - INTERNAL_ERROR (500): Unexpected server error
 */
export class AppError extends Error {
  /**
   * HTTP status code for the response
   * @example 400, 401, 403, 404, 409, 429, 500
   */
  public readonly statusCode: number;

  /**
   * Machine-readable error code for client handling
   * @example "PRODUCT_NOT_FOUND", "INVALID_TENANT", "RATE_LIMITED"
   */
  public readonly code: string;

  /**
   * Indicates if this is an expected operational error (true)
   * or an unexpected programming error (false).
   * Non-operational errors may trigger additional logging/alerting.
   */
  public readonly isOperational: boolean;

  /**
   * Creates a new AppError instance
   *
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} code - Machine-readable error code (default: "INTERNAL_ERROR")
   * @param {boolean} isOperational - Whether this is an expected error (default: true)
   */
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Factory Methods for Common Error Types
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Creates a 400 Bad Request error
   * @description Use for invalid input, validation failures, malformed requests
   *
   * @param {string} message - Error description
   * @param {string} code - Error code (default: "BAD_REQUEST")
   * @returns {AppError} Configured error instance
   *
   * @example
   * throw AppError.badRequest('Quantity must be positive');
   * throw AppError.badRequest('Invalid email format', 'INVALID_EMAIL');
   */
  static badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(message, 400, code);
  }

  /**
   * Creates a 401 Unauthorized error
   * @description Use when authentication is missing or invalid
   *
   * @param {string} message - Error description (default: "Unauthorized")
   * @param {string} code - Error code (default: "UNAUTHORIZED")
   * @returns {AppError} Configured error instance
   *
   * @example
   * throw AppError.unauthorized(); // Default message
   * throw AppError.unauthorized('Token expired', 'TOKEN_EXPIRED');
   */
  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
    return new AppError(message, 401, code);
  }

  /**
   * Creates a 403 Forbidden error
   * @description Use when user is authenticated but not authorized for the action
   *
   * @param {string} message - Error description (default: "Forbidden")
   * @param {string} code - Error code (default: "FORBIDDEN")
   * @returns {AppError} Configured error instance
   *
   * @example
   * throw AppError.forbidden('Only admins can delete tenants');
   * throw AppError.forbidden('Pro subscription required', 'PRO_REQUIRED');
   */
  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new AppError(message, 403, code);
  }

  /**
   * Creates a 404 Not Found error
   * @description Use when requested resource doesn't exist
   *
   * @param {string} message - Error description (default: "Resource not found")
   * @param {string} code - Error code (default: "NOT_FOUND")
   * @returns {AppError} Configured error instance
   *
   * @example
   * throw AppError.notFound('Product not found');
   * throw AppError.notFound(`Client ${id} not found`, 'CLIENT_NOT_FOUND');
   */
  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new AppError(message, 404, code);
  }

  /**
   * Creates a 409 Conflict error
   * @description Use for duplicate entries, state conflicts, concurrent modifications
   *
   * @param {string} message - Error description
   * @param {string} code - Error code (default: "CONFLICT")
   * @returns {AppError} Configured error instance
   *
   * @example
   * throw AppError.conflict('Email already registered');
   * throw AppError.conflict('Order already confirmed', 'ORDER_ALREADY_CONFIRMED');
   */
  static conflict(message: string, code = "CONFLICT") {
    return new AppError(message, 409, code);
  }

  /**
   * Creates a 429 Too Many Requests error
   * @description Use when rate limit is exceeded
   *
   * @param {string} message - Error description (default: "Too many requests")
   * @param {string} code - Error code (default: "RATE_LIMITED")
   * @returns {AppError} Configured error instance
   *
   * @example
   * throw AppError.tooManyRequests();
   * throw AppError.tooManyRequests('Please wait 60 seconds');
   */
  static tooManyRequests(message = "Too many requests", code = "RATE_LIMITED") {
    return new AppError(message, 429, code);
  }

  /**
   * Creates a 500 Internal Server Error
   * @description Use for unexpected server errors. These are marked as non-operational
   * to trigger additional logging/alerting.
   *
   * @param {string} message - Error description (default: "Internal server error")
   * @param {string} code - Error code (default: "INTERNAL_ERROR")
   * @returns {AppError} Configured error instance (isOperational = false)
   *
   * @example
   * throw AppError.internal('Database connection failed');
   */
  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new AppError(message, 500, code, false);
  }
}
