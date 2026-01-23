/**
 * Express Request Type Extensions
 */
import { Request } from "express";
import type { User, Tenant, TenantMember } from "@mirsklada/database";

/**
 * Request with authenticated user info
 */
export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
  user?: Pick<User, "id" | "email" | "name" | "avatarUrl">;
}

/**
 * Request with tenant context (after tenant middleware)
 */
export interface TenantRequest extends AuthenticatedRequest {
  tenantId: string;
  tenant?: Tenant;
  tenantMember?: TenantMember;
}
