/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */

const authService = require('./auth.service');
const { createError } = require('../../middlewares');

const authController = {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  register: async (req, res, next) => {
    try {
      const { email, password, fullName, phone, organizationName } = req.body;

      // Validate required fields
      if (!email || !password || !fullName || !organizationName) {
        throw createError.badRequest('Email, password, full name, and organization name are required');
      }

      const result = await authService.register({
        email,
        password,
        fullName,
        phone,
        organizationName,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful. Please check your email for verification.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw createError.badRequest('Email and password are required');
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        await authService.logout(token);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw createError.badRequest('Refresh token is required');
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  getCurrentUser: async (req, res, next) => {
    try {
      const user = await authService.getUserById(req.user.id);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user profile
   * PUT /api/v1/auth/me
   */
  updateProfile: async (req, res, next) => {
    try {
      const { fullName, phone } = req.body;

      const user = await authService.updateProfile(req.user.id, {
        fullName,
        phone,
      });

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change password
   * PUT /api/v1/auth/me/password
   */
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw createError.badRequest('Current password and new password are required');
      }

      await authService.changePassword(req.user.authId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw createError.badRequest('Email is required');
      }

      await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw createError.badRequest('Token and new password are required');
      }

      await authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
