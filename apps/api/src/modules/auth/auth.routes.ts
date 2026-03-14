/**
 * Auth Routes
 * Authentication endpoints
 */
import { Router, type Router as RouterType } from "express";
import * as authController from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  signUpBodySchema,
  signInBodySchema,
  refreshTokenBodySchema,
  forgotPasswordBodySchema,
  updateProfileBodySchema,
} from "./auth.schemas";

const router: RouterType = Router();

/**
 * @route   POST /auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/signup",
  validate({ body: signUpBodySchema }),
  authController.signUp,
);

/**
 * @route   POST /auth/signin
 * @desc    Sign in with email/password
 * @access  Public
 */
router.post(
  "/signin",
  validate({ body: signInBodySchema }),
  authController.signIn,
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post(
  "/refresh",
  validate({ body: refreshTokenBodySchema }),
  authController.refresh,
);

/**
 * @route   POST /auth/signout
 * @desc    Sign out current user
 * @access  Public (optional token)
 */
router.post("/signout", authController.signOut);

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  "/forgot-password",
  validate({ body: forgotPasswordBodySchema }),
  authController.forgotPassword,
);

/**
 * @route   GET /auth/me
 * @desc    Get current user info and tenants
 * @access  Private
 */
router.get("/me", authenticate, authController.me);

/**
 * @route   PATCH /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch(
  "/profile",
  authenticate,
  validate({ body: updateProfileBodySchema }),
  authController.updateProfile,
);

export { router as authRouter };
