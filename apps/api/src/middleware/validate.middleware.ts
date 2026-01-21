/**
 * Request Validation Middleware
 * Validates request body, query, and params using Zod schemas
 */
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/app-error";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validates request against Zod schemas
 * @example
 * router.post('/products',
 *   validate({ body: CreateProductSchema }),
 *   productController.create
 * );
 */
export const validate = (schemas: ValidationSchemas) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        next(
          new AppError(
            `Validation failed: ${formattedErrors.map((e) => e.message).join(", ")}`,
            400,
            "VALIDATION_ERROR",
          ),
        );
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validates only the request body
 * Shorthand for validate({ body: schema })
 */
export const validateBody = (schema: ZodSchema) => validate({ body: schema });

/**
 * Validates only query parameters
 */
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });

/**
 * Validates only URL parameters
 */
export const validateParams = (schema: ZodSchema) =>
  validate({ params: schema });
