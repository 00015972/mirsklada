/**
 * Stock Schemas
 * Zod validation schemas for stock requests
 */
import { z } from "zod";

export const CreateStockMovementSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  type: z.enum(["IN", "OUT", "ADJUST"], {
    errorMap: () => ({ message: "Type must be IN, OUT, or ADJUST" }),
  }),
  quantityKg: z
    .number()
    .positive("Quantity must be positive")
    .max(999999, "Quantity too large"),
  reason: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
});

export const BulkIntakeSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantityKg: z.number().positive().max(999999),
      }),
    )
    .min(1, "At least one item is required")
    .max(100, "Too many items"),
  reference: z.string().max(100).optional(),
});

export const MovementIdParamSchema = z.object({
  id: z.string().min(1, "Movement ID is required"),
});

export const ProductIdParamSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export const MovementQuerySchema = z.object({
  productId: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUST"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const StockLevelsQuerySchema = z.object({
  categoryId: z.string().optional(),
});

export const SummaryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
