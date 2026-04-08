/**
 * @file Utilities Module Exports
 * @description Central export point for utility functions used throughout the API.
 *
 * @module apps/api/src/utils
 *
 * @exports
 * - AppError: Custom error class for operational errors
 * - asyncHandler: Wrapper for async route handlers
 * - logger: Structured logging utility
 *
 * @connections
 * - Used by: All modules for error handling and logging
 */
export { AppError } from "./app-error";
export { asyncHandler } from "./async-handler";
export { logger } from "./logger";
