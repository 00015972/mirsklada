/**
 * Tenant Service
 * Business logic for tenant/workspace management
 */
import { prisma } from "@mirsklada/database";
import { AppError } from "../../utils/app-error";
import { TIER_LIMITS } from "@mirsklada/shared";
import type {
  CreateTenantInput,
  UpdateTenantInput,
  InviteMemberInput,
} from "./tenant.schemas";

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * Ensure slug is unique, appending a number if needed
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

class TenantService {
  /**
   * Get all tenants for a user
   */
  async findAllForUser(userId: string) {
    const memberships = await prisma.tenantMember.findMany({
      where: {
        userId,
        status: "active",
      },
      include: {
        tenant: true,
      },
      orderBy: {
        tenant: { name: "asc" },
      },
    });

    return memberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      subscriptionTier: m.tenant.subscriptionTier,
      status: m.tenant.status,
      role: m.role,
      createdAt: m.tenant.createdAt,
    }));
  }

  /**
   * Get a single tenant by ID (with membership check)
   */
  async findById(tenantId: string, userId: string) {
    const membership = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        userId,
        status: "active",
      },
      include: {
        tenant: true,
      },
    });

    if (!membership) {
      throw new AppError(
        "Tenant not found or access denied",
        404,
        "TENANT_NOT_FOUND",
      );
    }

    return {
      ...membership.tenant,
      role: membership.role,
    };
  }

  /**
   * Create a new tenant and assign the creator as admin
   */
  async create(userId: string, input: CreateTenantInput) {
    // Enforce workspace limit
    const adminMemberships = await prisma.tenantMember.findMany({
      where: { userId, role: "admin", status: "active" },
      include: { tenant: { select: { subscriptionTier: true, status: true } } },
    });
    const activeAdminTenants = adminMemberships.filter(
      (m) => m.tenant.status === "active",
    );
    const hasProTenant = activeAdminTenants.some(
      (m) => m.tenant.subscriptionTier === "pro",
    );
    const maxWorkspaces = hasProTenant
      ? TIER_LIMITS.pro.maxWorkspaces
      : TIER_LIMITS.basic.maxWorkspaces;
    if (activeAdminTenants.length >= maxWorkspaces) {
      throw AppError.forbidden(
        `You have reached the maximum number of workspaces (${maxWorkspaces}). Upgrade to Pro to create more.`,
        "LIMIT_EXCEEDED",
      );
    }

    // Generate slug from name if not provided
    const baseSlug = input.slug || generateSlug(input.name);
    const slug = await ensureUniqueSlug(baseSlug);

    // Create tenant and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug,
          subscriptionTier: "basic",
          status: "active",
        },
      });

      // Add creator as admin
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId,
          role: "admin",
          status: "active",
        },
      });

      return tenant;
    });

    return {
      ...result,
      role: "admin",
    };
  }

  /**
   * Update tenant details (admin only)
   */
  async update(tenantId: string, userId: string, input: UpdateTenantInput) {
    // Check admin access
    const membership = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        userId,
        role: "admin",
        status: "active",
      },
    });

    if (!membership) {
      throw new AppError("Admin access required", 403, "FORBIDDEN");
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: input.name,
      },
    });

    return {
      ...tenant,
      role: "admin",
    };
  }

  /**
   * Delete a tenant (admin only, with confirmation)
   */
  async delete(tenantId: string, userId: string) {
    // Check admin access
    const membership = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        userId,
        role: "admin",
        status: "active",
      },
    });

    if (!membership) {
      throw new AppError("Admin access required", 403, "FORBIDDEN");
    }

    // Soft delete by changing status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: "cancelled" },
    });

    return { success: true };
  }

  /**
   * Get all members of a tenant
   */
  async getMembers(tenantId: string, userId: string) {
    // Verify user has access to this tenant
    const membership = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        userId,
        status: "active",
      },
    });

    if (!membership) {
      throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    const members = await prisma.tenantMember.findMany({
      where: {
        tenantId,
        status: { not: "disabled" },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      status: m.status,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Invite a new member to a tenant
   */
  async inviteMember(
    tenantId: string,
    adminUserId: string,
    input: InviteMemberInput,
  ) {
    // Check admin access
    const adminMembership = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        userId: adminUserId,
        role: "admin",
        status: "active",
      },
    });

    if (!adminMembership) {
      throw new AppError("Admin access required", 403, "FORBIDDEN");
    }

    // Enforce member limit based on tenant's subscription tier
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionTier: true },
    });
    const tier = (tenant?.subscriptionTier ?? "basic") as "basic" | "pro";
    const maxMembers = TIER_LIMITS[tier].maxMembers;
    const memberCount = await prisma.tenantMember.count({
      where: { tenantId, status: "active" },
    });
    if (memberCount >= maxMembers) {
      throw AppError.forbidden(
        `${tier === "basic" ? "Basic" : "Pro"} plan allows up to ${maxMembers} user(s). Upgrade to ${tier === "basic" ? "Pro" : "a higher plan"} to invite more members.`,
        "LIMIT_EXCEEDED",
      );
    }

    // Find or validate the user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // For now, user must exist in the system
      // TODO: In future, send email invitation for non-existing users
      throw new AppError(
        "User not found. They must sign up first.",
        404,
        "USER_NOT_FOUND",
      );
    }

    // Check if already a member
    const existingMembership = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        userId: user.id,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === "active") {
        throw new AppError("User is already a member", 400, "ALREADY_MEMBER");
      }
      // Reactivate disabled membership
      const updated = await prisma.tenantMember.update({
        where: { id: existingMembership.id },
        data: {
          status: "active",
          role: input.role,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
      });

      return {
        id: updated.id,
        userId: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
        role: updated.role,
        status: updated.status,
      };
    }

    // Create new membership
    const membership = await prisma.tenantMember.create({
      data: {
        tenantId,
        userId: user.id,
        role: input.role,
        status: "active",
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });

    return {
      id: membership.id,
      userId: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      role: membership.role,
      status: membership.status,
    };
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    tenantId: string,
    memberId: string,
    adminUserId: string,
    role: "admin" | "staff",
  ) {
    // Check admin access
    const adminMembership = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        userId: adminUserId,
        role: "admin",
        status: "active",
      },
    });

    if (!adminMembership) {
      throw new AppError("Admin access required", 403, "FORBIDDEN");
    }

    // Cannot change own role
    if (adminMembership.id === memberId) {
      throw new AppError(
        "Cannot change your own role",
        400,
        "CANNOT_CHANGE_OWN_ROLE",
      );
    }

    const membership = await prisma.tenantMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return {
      id: membership.id,
      userId: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      role: membership.role,
    };
  }

  /**
   * Remove a member from a tenant
   */
  async removeMember(tenantId: string, memberId: string, adminUserId: string) {
    // Check admin access
    const adminMembership = await prisma.tenantMember.findFirst({
      where: {
        tenantId,
        userId: adminUserId,
        role: "admin",
        status: "active",
      },
    });

    if (!adminMembership) {
      throw new AppError("Admin access required", 403, "FORBIDDEN");
    }

    // Cannot remove self
    if (adminMembership.id === memberId) {
      throw new AppError("Cannot remove yourself", 400, "CANNOT_REMOVE_SELF");
    }

    // Soft delete membership
    await prisma.tenantMember.update({
      where: { id: memberId },
      data: { status: "disabled" },
    });

    return { success: true };
  }
}

export const tenantService = new TenantService();
