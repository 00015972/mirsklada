/**
 * User Sync Service
 * Syncs Supabase Auth users to local database
 */
import { prisma, User } from "@mirsklada/database";
import { SupabaseUser } from "../config/supabase";
import { logger } from "../utils/logger";

/**
 * Sync a Supabase user to local database
 * Creates user if not exists, updates if exists
 */
export const syncUserFromSupabase = async (
  supabaseUser: SupabaseUser,
): Promise<User> => {
  const { id, email, user_metadata } = supabaseUser;

  if (!email) {
    throw new Error("User email is required");
  }

  // Check if user exists by email (more reliable than Supabase ID)
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    // Update existing user if needed
    const needsUpdate =
      user.name !== (user_metadata?.name || user_metadata?.full_name) ||
      user.avatarUrl !== user_metadata?.avatar_url;

    if (needsUpdate) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user_metadata?.name || user_metadata?.full_name || user.name,
          avatarUrl: user_metadata?.avatar_url || user.avatarUrl,
        },
      });
      logger.debug("User updated from Supabase", { userId: user.id, email });
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        id, // Use Supabase user ID as our user ID for consistency
        email,
        name: user_metadata?.name || user_metadata?.full_name || null,
        avatarUrl: user_metadata?.avatar_url || null,
      },
    });
    logger.info("New user synced from Supabase", { userId: user.id, email });
  }

  return user;
};

/**
 * Get user by ID from local database
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id: userId },
  });
};

/**
 * Get user by email from local database
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Get user's tenant memberships
 */
export const getUserTenants = async (userId: string) => {
  return prisma.tenantMember.findMany({
    where: {
      userId,
      status: "active",
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionTier: true,
          status: true,
        },
      },
    },
  });
};
