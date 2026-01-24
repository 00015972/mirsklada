/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */

const { ROLES, ERROR_CODES } = require('../config/constants');

/**
 * Check if user has required role(s)
 * @param {...string} allowedRoles - Roles that can access the route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'Authentication required',
        },
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTHORIZATION_ERROR,
          message: 'You do not have permission to perform this action',
          details: {
            required: allowedRoles,
            current: userRole,
          },
        },
      });
    }

    next();
  };
};

/**
 * Predefined role combinations
 */
const roleMiddleware = {
  // Only owner can access
  ownerOnly: requireRole(ROLES.OWNER),

  // Owner and warehouse manager can access
  managerAndAbove: requireRole(ROLES.OWNER, ROLES.WAREHOUSE_MANAGER),

  // All authenticated users can access
  anyRole: requireRole(ROLES.OWNER, ROLES.WAREHOUSE_MANAGER, ROLES.SALESPERSON),

  // Custom role check
  requireRole,
};

/**
 * Check if user can view purchase prices
 * Salespersons cannot see purchase prices
 */
const canViewPurchasePrice = (req, res, next) => {
  if (req.user.role === ROLES.SALESPERSON) {
    // Mark that this user cannot view purchase prices
    req.hidePurchasePrice = true;
  }
  next();
};

/**
 * Check if user can view all orders or only their own
 * Salespersons can only view orders they created
 */
const filterOwnOrders = (req, res, next) => {
  if (req.user.role === ROLES.SALESPERSON) {
    req.filterByCreator = true;
  }
  next();
};

module.exports = {
  ...roleMiddleware,
  canViewPurchasePrice,
  filterOwnOrders,
};
