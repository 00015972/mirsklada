/**
 * Order Schemas
 * Zod validation schemas for order requests
 */
import { z } from "zod";
import type { PaymentStatus } from "./order.service";

const OrderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantityKg: z
    .number()
    .positive("Quantity must be positive")
    .max(999999, "Quantity too large"),
  pricePerKg: z.number().positive().max(999999999).optional(),
});

export const CreateOrderSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  items: z
    .array(OrderItemSchema)
    .min(1, "At least one item is required")
    .max(100, "Too many items"),
  notes: z.string().max(1000).optional(),
});

export const UpdateOrderSchema = z.object({
  notes: z.string().max(1000).nullable().optional(),
});

export const OrderIdParamSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
});

export const OrderQuerySchema = z.object({
  clientId: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  paymentStatus: z
    .string()
    .optional()
    .transform((val) => (val ? (val.split(",").map((s) => s.trim()) as PaymentStatus[]) : undefined))
    .pipe(z.array(z.enum(["UNPAID", "PARTIAL", "PAID"])).optional()),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
