/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

/**
 * Wraps an async function to catch errors and forward to Express error handler
 * @example
 * router.get('/products', asyncHandler(async (req, res) => {
 *   const products = await productService.findAll(req.tenantId);
 *   res.json(products);
 * }));
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
