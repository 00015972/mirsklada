/**
 * Express Type Extensions
 * Extends Express Request with custom properties
 */

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user ID (from Supabase/JWT) */
      userId?: string;
      /** Authenticated user email */
      userEmail?: string;
      /** Current tenant ID (from x-tenant-id header) */
      tenantId?: string;
      /** User's role in the current tenant */
      userRole?: "admin" | "staff";
      /** Tenant's subscription tier */
      subscriptionTier?: "basic" | "pro";
      /** Request start time for duration logging */
      startTime?: number;
    }
  }
}

export {};
