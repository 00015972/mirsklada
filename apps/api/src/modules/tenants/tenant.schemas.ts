/**
 * Tenant Schemas
 * Zod validation schemas for tenant operations
 */
import { z } from "zod";

// Slug must be lowercase alphanumeric with hyphens
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createTenantBodySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be less than 255 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(slugRegex, "Slug must be lowercase alphanumeric with hyphens only")
    .optional(),
});

export const createTenantSchema = {
  body: createTenantBodySchema,
};

const updateTenantBodySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be less than 255 characters")
    .optional(),
});

const tenantIdParamsSchema = z.object({
  id: z.string().min(1, "Tenant ID is required"),
});

export const updateTenantSchema = {
  params: tenantIdParamsSchema,
  body: updateTenantBodySchema,
};

export const tenantIdParamSchema = {
  params: tenantIdParamsSchema,
};

const inviteMemberBodySchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "staff"]).default("staff"),
});

export const inviteMemberSchema = {
  params: tenantIdParamsSchema,
  body: inviteMemberBodySchema,
};

const memberIdParamsSchema = z.object({
  id: z.string().min(1, "Tenant ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
});

const updateMemberRoleBodySchema = z.object({
  role: z.enum(["admin", "staff"]),
});

export const updateMemberRoleSchema = {
  params: memberIdParamsSchema,
  body: updateMemberRoleBodySchema,
};

export type CreateTenantInput = z.infer<typeof createTenantBodySchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantBodySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberBodySchema>;
