import api from './api';

/**
 * Products Service - Product API calls
 */
export const productsService = {
  /**
   * Get all products with filters
   */
  getAll: (params = {}) => api.get('/products', { params }),

  /**
   * Get product by ID
   */
  getById: (id) => api.get(`/products/${id}`),

  /**
   * Create new product
   */
  create: (data) => api.post('/products', data),

  /**
   * Update product
   */
  update: (id, data) => api.put(`/products/${id}`, data),

  /**
   * Delete product
   */
  delete: (id) => api.delete(`/products/${id}`),

  /**
   * Get product units
   */
  getUnits: (productId) => api.get(`/products/${productId}/units`),

  /**
   * Add product unit
   */
  addUnit: (productId, data) => api.post(`/products/${productId}/units`, data),

  /**
   * Remove product unit
   */
  removeUnit: (productId, unitId) => api.delete(`/products/${productId}/units/${unitId}`),

  /**
   * Get low stock products
   */
  getLowStock: () => api.get('/products/low-stock'),
};
