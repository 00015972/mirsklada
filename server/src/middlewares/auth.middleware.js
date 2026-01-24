/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const { ERROR_CODES } = require('../config/constants');

/**
 * Verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'Access token is required',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'Invalid or expired token',
        },
      });
    }

    // Get user details from our users table
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*, organizations(*)')
      .eq('auth_id', user.id)
      .single();

    if (dbError || !dbUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'User not found in system',
        },
      });
    }

    if (!dbUser.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'User account is deactivated',
        },
      });
    }

    // Attach user to request
    req.user = {
      id: dbUser.id,
      authId: user.id,
      email: dbUser.email,
      fullName: dbUser.full_name,
      role: dbUser.role,
      organizationId: dbUser.organization_id,
      organization: dbUser.organizations,
    };

    // Attach token for downstream use
    req.accessToken = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication failed',
      },
    });
  }
};

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // If token present, verify it
  return authMiddleware(req, res, next);
};

module.exports = {
  authMiddleware,
  optionalAuth,
};
