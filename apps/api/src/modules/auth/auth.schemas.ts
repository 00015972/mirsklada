/**
 * Auth Schemas
 * Validation schemas for authentication endpoints
 */
import { z } from "zod";

export const signUpBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const signInBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateProfileBodySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").nullish(),
});

export type SignUpInput = z.infer<typeof signUpBodySchema>;
export type SignInInput = z.infer<typeof signInBodySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordBodySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>;
