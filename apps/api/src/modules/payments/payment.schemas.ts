/**
 * Payment Schemas
 * Zod validation schemas for payment requests
 */
import { z } from "zod";

export const RecordPaymentSchema = z.object({
  orderId: z.string().optional(),
  clientId: z.string().min(1, "Client ID is required"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(9999999999, "Amount too large"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "CLICK", "PAYME"], {
    errorMap: () => ({
      message: "Method must be CASH, CARD, TRANSFER, CLICK, or PAYME",
    }),
  }),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const VoidPaymentSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
});

export const PaymentIdParamSchema = z.object({
  id: z.string().min(1, "Payment ID is required"),
});

export const ClientIdParamSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
});

export const PaymentQuerySchema = z.object({
  clientId: z.string().optional(),
  orderId: z.string().optional(),
  method: z.enum(["CASH", "CARD", "TRANSFER", "CLICK", "PAYME"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const SummaryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
