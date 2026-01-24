/**
 * Auth Module Index
 */

const authRoutes = require('./auth.routes');
const authController = require('./auth.controller');
const authService = require('./auth.service');

module.exports = {
  authRoutes,
  authController,
  authService,
};
