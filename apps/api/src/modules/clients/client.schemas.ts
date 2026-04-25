/**
 * Client Schemas
 * Zod validation schemas for client requests
 */
import { z } from "zod";

export const CreateClientSchema = z.object({
  name: z
    .string()
    .min(1, "Client name is required")
    .max(255, "Client name too long"),
  phone: z
    .string()
    .max(20)
    .regex(/^[\d\s+()-]+$/, "Invalid phone number format")
    .optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z
    .string()
    .max(20)
    .regex(/^[\d\s+()-]+$/, "Invalid phone number format")
    .nullable()
    .optional(),
  address: z.string().max(500).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const ClientIdParamSchema = z.object({
  id: z.string().min(1, "Client ID is required"),
});

export const ClientQuerySchema = z.object({
  search: z.string().max(100).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  hasDebt: z.enum(["true", "false"]).optional(),
});

export const ClientOrdersQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
});
