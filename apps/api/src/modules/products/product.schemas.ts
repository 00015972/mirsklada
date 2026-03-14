/**
 * Product Schemas
 * Zod validation schemas for product requests
 */
import { z } from "zod";

export const CreateProductSchema = z.object({
  categoryId: z.string().optional(),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name too long"),
  description: z.string().max(1000).optional(),
  unit: z.string().max(20).default("kg"),
  basePricePerKg: z
    .number()
    .positive("Price must be positive")
    .max(999999999, "Price too high"),
  currentStockKg: z.number().min(0).default(0),
  minStockKg: z.number().min(0).default(0),
});

export const UpdateProductSchema = z.object({
  categoryId: z.string().nullable().optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  unit: z.string().max(20).optional(),
  basePricePerKg: z.number().positive().max(999999999).optional(),
  minStockKg: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const ProductIdParamSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
});

export const ProductQuerySchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().max(100).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  lowStock: z.enum(["true", "false"]).optional(),
});
