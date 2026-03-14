/**
 * Category Schemas
 * Zod validation schemas for category requests
 */
import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(255, "Category name too long"),
  sortOrder: z.number().int().min(0).optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const CategoryIdParamSchema = z.object({
  id: z.string().min(1, "Category ID is required"),
});
