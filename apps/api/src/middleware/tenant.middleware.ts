/**
 * Tenant Resolution Middleware
 * Resolves and validates tenant access from x-tenant-id header
 */
import { Request, Response, NextFunction } from "express";
import { prisma } from "@mirsklada/database";
import { AppError } from "../utils/app-error";
import { logger } from "../utils/logger";

/**
 * Resolves tenant from x-tenant-id header
 * Verifies user has access to the tenant
 * Sets req.tenantId, req.userRole, req.subscriptionTier
 */
export const resolveTenant = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;

    if (!tenantId) {
      throw AppError.badRequest(
        "x-tenant-id header is required",
        "TENANT_REQUIRED",
      );
    }

    // Skip DB check in development if no userId (for testing)
    if (process.env.NODE_ENV === "development" && !req.userId) {
      req.tenantId = tenantId;
      req.userRole = "admin";
      req.subscriptionTier = "pro";
      logger.debug("Tenant: Development mode - skipping membership check", {
        tenantId,
      });
      return next();
    }

    // Verify user has access to this tenant
    const membership = await prisma.tenantMember.findFirst({
      where: {
        userId: req.userId,
        tenantId,
        status: "active",
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            status: true,
          },
        },
      },
    });

    if (!membership) {
      throw AppError.forbidden(
        "You do not have access to this tenant",
        "TENANT_ACCESS_DENIED",
      );
    }

    if (membership.tenant.status !== "active") {
      throw AppError.forbidden(
        "This tenant account is suspended",
        "TENANT_SUSPENDED",
      );
    }

    // Set tenant context on request
    req.tenantId = tenantId;
    req.userRole = membership.role as "admin" | "staff";
    req.subscriptionTier = membership.tenant.subscriptionTier as
      | "basic"
      | "pro";

    logger.debug("Tenant resolved", {
      tenantId,
      tenantName: membership.tenant.name,
      userRole: req.userRole,
      tier: req.subscriptionTier,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Requires user to have admin role in the tenant
 * Must be used after resolveTenant middleware
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.userRole !== "admin") {
    throw AppError.forbidden("Admin access required", "ADMIN_REQUIRED");
  }
  next();
};
