/**
 * Application Constants
 */

module.exports = {
  // User roles
  ROLES: {
    OWNER: 'owner',
    WAREHOUSE_MANAGER: 'warehouse_manager',
    SALESPERSON: 'salesperson',
  },

  // Order statuses
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Purchase statuses
  PURCHASE_STATUS: {
    PENDING: 'pending',
    PARTIAL: 'partial',
    PAID: 'paid',
  },

  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    BANK_TRANSFER: 'bank_transfer',
  },

  // Delivery methods
  DELIVERY_METHODS: {
    SELF: 'self',
    TAXI: 'taxi',
  },

  // Order sources
  ORDER_SOURCES: {
    WEB: 'web',
    TELEGRAM: 'telegram',
  },

  // Stock movement types
  STOCK_MOVEMENT_TYPES: {
    PURCHASE_IN: 'purchase_in',
    SALE_OUT: 'sale_out',
    ADJUSTMENT: 'adjustment',
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  },
};
