/**
 * Auth Service
 * Handles authentication operations with Supabase
 */
import { getSupabase, isSupabaseConfigured } from "../../config/supabase";
import {
  syncUserFromSupabase,
  getUserTenants,
} from "../../services/user-sync.service";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";
import type {
  SignUpInput,
  SignInInput,
  ForgotPasswordInput,
} from "./auth.schemas";

/**
 * Sign up a new user
 */
export const signUp = async (input: SignUpInput) => {
  if (!isSupabaseConfigured()) {
    throw AppError.internal("Authentication not configured");
  }

  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
      },
    },
  });

  if (error) {
    logger.warn("Sign up failed", { email: input.email, error: error.message });

    if (error.message.includes("already registered")) {
      throw AppError.conflict("Email already registered", "EMAIL_EXISTS");
    }
    throw AppError.badRequest(error.message, "SIGNUP_FAILED");
  }

  if (!data.user) {
    throw AppError.internal("User creation failed");
  }

  // Sync to local database
  const localUser = await syncUserFromSupabase(data.user);

  logger.info("User signed up", {
    userId: localUser.id,
    email: localUser.email,
  });

  return {
    user: {
      id: localUser.id,
      email: localUser.email,
      name: localUser.name,
    },
    session: data.session
      ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
        }
      : null,
    confirmationRequired: !data.session, // If no session, email confirmation needed
  };
};

/**
 * Sign in an existing user
 */
export const signIn = async (input: SignInInput) => {
  if (!isSupabaseConfigured()) {
    throw AppError.internal("Authentication not configured");
  }

  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    logger.warn("Sign in failed", { email: input.email, error: error.message });

    if (error.message.includes("Invalid login credentials")) {
      throw AppError.unauthorized(
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }
    if (error.message.includes("Email not confirmed")) {
      throw AppError.forbidden(
        "Please confirm your email first",
        "EMAIL_NOT_CONFIRMED",
      );
    }
    throw AppError.unauthorized(error.message, "SIGNIN_FAILED");
  }

  if (!data.user || !data.session) {
    throw AppError.internal("Sign in failed");
  }

  // Sync to local database
  const localUser = await syncUserFromSupabase(data.user);

  // Get user's tenants
  const tenants = await getUserTenants(localUser.id);

  logger.info("User signed in", {
    userId: localUser.id,
    email: localUser.email,
  });

  return {
    user: {
      id: localUser.id,
      email: localUser.email,
      name: localUser.name,
      avatarUrl: localUser.avatarUrl,
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
    tenants: tenants.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role,
      subscriptionTier: m.tenant.subscriptionTier,
    })),
  };
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string) => {
  if (!isSupabaseConfigured()) {
    throw AppError.internal("Authentication not configured");
  }

  const supabase = getSupabase();

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    logger.warn("Token refresh failed", { error: error?.message });
    throw AppError.unauthorized(
      "Invalid or expired refresh token",
      "REFRESH_FAILED",
    );
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
  };
};

/**
 * Sign out user (revoke session)
 */
export const signOut = async (accessToken: string) => {
  if (!isSupabaseConfigured()) {
    throw AppError.internal("Authentication not configured");
  }

  const supabase = getSupabase();

  // Set the session to revoke
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: "",
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.warn("Sign out failed", { error: error.message });
    // Don't throw - user might already be signed out
  }

  logger.debug("User signed out");
};

/**
 * Request password reset email
 */
export const forgotPassword = async (input: ForgotPasswordInput) => {
  if (!isSupabaseConfigured()) {
    throw AppError.internal("Authentication not configured");
  }

  const supabase = getSupabase();

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${process.env.CORS_ORIGIN || "http://localhost:5173"}/reset-password`,
  });

  if (error) {
    logger.warn("Password reset request failed", { error: error.message });
    // Don't reveal if email exists or not
  }

  // Always return success to prevent email enumeration
  return {
    message: "If the email exists, a password reset link has been sent",
  };
};

/**
 * Get current user info (from token)
 */
export const getCurrentUser = async (userId: string) => {
  const tenants = await getUserTenants(userId);

  const { prisma } = await import("@mirsklada/database");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return {
    user,
    tenants: tenants.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role,
      subscriptionTier: m.tenant.subscriptionTier,
    })),
  };
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  input: { name?: string | null },
) => {
  const { prisma } = await import("@mirsklada/database");

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });

  logger.info("User profile updated", { userId: user.id });

  return { user };
};
