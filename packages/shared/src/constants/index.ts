// Constants for Mirsklada

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION TIERS
// ═══════════════════════════════════════════════════════════════

export const SUBSCRIPTION_TIERS = {
  BASIC: "basic",
  PRO: "pro",
} as const;

export const TIER_LIMITS = {
  basic: {
    maxProducts: 20,
    maxClients: 10,
    maxWorkspaces: 1,
    maxMembers: 1,
    features: ["stock", "orders", "debt", "reports_basic"],
  },
  pro: {
    maxProducts: Infinity,
    maxClients: Infinity,
    maxWorkspaces: 3,
    maxMembers: 5,
    features: [
      "stock",
      "orders",
      "debt",
      "reports_basic",
      "reports_advanced",
      "reports_export",
      "google_drive",
      "yandex_delivery",
      "price_matrices",
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// USER ROLES
// ═══════════════════════════════════════════════════════════════

export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  STAFF: "staff",
} as const;

export const ROLE_PERMISSIONS = {
  superadmin: ["*"], // All permissions
  admin: [
    "products:read",
    "products:write",
    "products:delete",
    "clients:read",
    "clients:write",
    "clients:delete",
    "orders:read",
    "orders:write",
    "orders:delete",
    "payments:read",
    "payments:write",
    "stock:read",
    "stock:write",
    "reports:read",
    "settings:read",
    "settings:write",
    "integrations:manage",
  ],
  staff: [
    "products:read",
    "clients:read",
    "orders:read",
    "orders:write",
    "stock:read",
    "stock:write",
  ],
} as const;

// ═══════════════════════════════════════════════════════════════
// ORDER STATUSES
// ═══════════════════════════════════════════════════════════════

export const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const ORDER_STATUS_FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivered", "cancelled"],
  delivered: [], // Final state
  cancelled: [], // Final state
} as const;

// ═══════════════════════════════════════════════════════════════
// PAYMENT METHODS
// ═══════════════════════════════════════════════════════════════

export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  TRANSFER: "transfer",
  CLICK: "click",
  PAYME: "payme",
} as const;

// ═══════════════════════════════════════════════════════════════
// STOCK MOVEMENT TYPES
// ═══════════════════════════════════════════════════════════════

export const STOCK_MOVEMENT_TYPES = {
  IN: "IN",
  OUT: "OUT",
  ADJUST: "ADJUST",
} as const;

// ═══════════════════════════════════════════════════════════════
// ERROR CODES
// ═══════════════════════════════════════════════════════════════

export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Tenant
  TENANT_REQUIRED: "TENANT_REQUIRED",
  TENANT_NOT_FOUND: "TENANT_NOT_FOUND",
  TENANT_ACCESS_DENIED: "TENANT_ACCESS_DENIED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  CLIENT_NOT_FOUND: "CLIENT_NOT_FOUND",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",

  // Business Logic
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  INVALID_ORDER_STATUS: "INVALID_ORDER_STATUS",

  // Subscription
  FEATURE_REQUIRES_PRO: "FEATURE_REQUIRES_PRO",
  LIMIT_EXCEEDED: "LIMIT_EXCEEDED",

  // General
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

// ═══════════════════════════════════════════════════════════════
// LANGUAGES
// ═══════════════════════════════════════════════════════════════

export const SUPPORTED_LANGUAGES = ["en", "ru", "uz"] as const;
export const DEFAULT_LANGUAGE = "ru";

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════

export const API_VERSION = "v1";
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
