/**
 * Middlewares Index
 * Exports all middleware modules
 */

const { authMiddleware, optionalAuth } = require('./auth.middleware');
const roleMiddleware = require('./role.middleware');
const errorMiddleware = require('./error.middleware');
const { ApiError, createError } = require('./error.middleware');

module.exports = {
  authMiddleware,
  optionalAuth,
  ...roleMiddleware,
  errorMiddleware,
  ApiError,
  createError,
};
