import api from './api';

/**
 * Auth Service - Authentication API calls
 */
export const authService = {
  /**
   * Login user
   */
  login: (email, password) => api.post('/auth/login', { email, password }),

  /**
   * Register new user/organization
   */
  register: (data) => api.post('/auth/register', data),

  /**
   * Logout user
   */
  logout: () => api.post('/auth/logout'),

  /**
   * Get current user profile
   */
  getProfile: () => api.get('/auth/profile'),

  /**
   * Update user profile
   */
  updateProfile: (data) => api.put('/auth/profile', data),

  /**
   * Refresh token
   */
  refreshToken: () => api.post('/auth/refresh'),
};
