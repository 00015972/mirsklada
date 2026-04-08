/**
 * @file Async Handler Wrapper
 * @description Utility wrapper for async Express route handlers that automatically
 * catches rejected promises and forwards errors to the Express error handling middleware.
 * Without this wrapper, unhandled promise rejections in async handlers would crash the server.
 *
 * @module apps/api/src/utils/async-handler
 *
 * @connections
 * - Used by: All controller files for wrapping async route handlers
 * - Works with: ./middleware/error.middleware.ts (receives forwarded errors)
 * - Exported via: ./index.ts
 *
 * @why_needed
 * Express doesn't natively catch errors from async functions. Without this wrapper:
 * ```typescript
 * // BAD - Unhandled rejection if service throws
 * router.get('/products', async (req, res) => {
 *   const products = await productService.findAll(); // If this throws, server crashes
 *   res.json(products);
 * });
 * ```
 *
 * With asyncHandler:
 * ```typescript
 * // GOOD - Errors are caught and forwarded to error middleware
 * router.get('/products', asyncHandler(async (req, res) => {
 *   const products = await productService.findAll(); // If this throws, error middleware handles it
 *   res.json(products);
 * }));
 * ```
 */
import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Type definition for async request handlers
 * @description Defines the signature for async route handler functions.
 * Can return void (no explicit response) or Response (using res.json(), etc.)
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

/**
 * Wraps an async function to catch errors and forward to Express error handler
 *
 * @param {AsyncRequestHandler} fn - Async route handler function to wrap
 * @returns {RequestHandler} Wrapped handler that catches promise rejections
 *
 * @usage
 * ```typescript
 * import { asyncHandler } from '@/utils';
 *
 * // In routes file:
 * router.get('/products', asyncHandler(async (req, res) => {
 *   const products = await productService.findAll(req.tenantId);
 *   res.json(products);
 * }));
 *
 * // Errors thrown in the handler are automatically caught:
 * router.post('/products', asyncHandler(async (req, res) => {
 *   throw AppError.badRequest('Invalid data'); // Caught and sent to errorHandler
 * }));
 * ```
 *
 * @flow
 * 1. Receives async handler function
 * 2. Returns new synchronous handler
 * 3. When route is called, executes async function
 * 4. If promise resolves - normal response
 * 5. If promise rejects - calls next(error) to forward to error middleware
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Execute the async handler and catch any rejections
    // Promise.resolve ensures even sync errors are caught
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
