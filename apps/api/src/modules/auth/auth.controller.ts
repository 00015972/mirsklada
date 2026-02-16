/**
 * Auth Controller
 * HTTP handlers for authentication endpoints
 */
import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import type {
  SignUpInput,
  SignInInput,
  RefreshTokenInput,
  ForgotPasswordInput,
} from "./auth.schemas";

/**
 * POST /auth/signup
 * Register a new user
 */
export const signUp = async (
  req: Request<unknown, unknown, SignUpInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.signUp(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/signin
 * Sign in with email and password
 */
export const signIn = async (
  req: Request<unknown, unknown, SignInInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.signIn(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 * Refresh access token
 */
export const refresh = async (
  req: Request<unknown, unknown, RefreshTokenInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/signout
 * Sign out current user
 */
export const signOut = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (token) {
      await authService.signOut(token);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/forgot-password
 * Request password reset email
 */
export const forgotPassword = async (
  req: Request<unknown, unknown, ForgotPasswordInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 * Get current user info
 */
export const me = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.getCurrentUser(req.userId!);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /auth/profile
 * Update user profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.updateProfile(req.userId!, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
