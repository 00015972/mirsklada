/**
 * @file API Client with Auth Interceptors
 * @description Axios HTTP client configured for the Mirsklada API.
 * Automatically injects authentication tokens and tenant headers.
 * Handles token refresh on 401 responses.
 *
 * @module apps/web/src/lib/api
 *
 * @connections
 * - Uses: @/stores/auth.store (for auth tokens and tenant ID)
 * - Used by: All pages and components that make API calls
 *
 * @features
 * - Auto-inject Authorization header with JWT token
 * - Auto-inject x-tenant-id header for multi-tenancy
 * - Auto-refresh expired tokens on 401 response
 * - Cache-control headers for GET requests
 * - Typed API methods for each resource
 *
 * @error_handling
 * - 401: Attempts token refresh, retries request, or logs out
 * - Other errors: Propagated to calling code for handling
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Extended request config to track retry attempts
 * @description Prevents infinite retry loops on token refresh
 */
type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

/**
 * API Base URL
 * @description Uses environment variable or falls back to relative path
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * Axios Instance
 * @description Configured axios instance with base URL and default headers
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor - Auth Token Injection
 * @description Automatically adds authentication headers to all requests:
 * - Authorization: Bearer <accessToken>
 * - x-tenant-id: <currentTenantId>
 * - Cache-Control: no-cache (for GET requests)
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { session, currentTenantId } = useAuthStore.getState();

    // Add JWT token if authenticated
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    // Add tenant ID for multi-tenancy
    if (currentTenantId) {
      config.headers["x-tenant-id"] = currentTenantId;
    }

    // Disable caching for GET requests to ensure fresh data
    if (config.method?.toUpperCase() === "GET") {
      config.headers["Cache-Control"] = "no-cache";
      config.headers.Pragma = "no-cache";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor - Token Refresh Handler
 * @description Handles 401 responses by attempting to refresh the token:
 * 1. Check if this is a 401 and we haven't already retried
 * 2. Attempt to refresh the session
 * 3. Retry the original request with new token
 * 4. Logout if refresh fails
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // Handle 401 Unauthorized - attempt token refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true;

      try {
        const { session, refreshSession, logout } = useAuthStore.getState();

        if (session?.refreshToken) {
          // Attempt to refresh the session
          await refreshSession();
          const newSession = useAuthStore.getState().session;

          if (newSession?.accessToken) {
            // Update the request with new token and retry
            originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
            return api(originalRequest);
          }
        }

        // Refresh failed - force logout
        logout();
      } catch {
        // Error during refresh - force logout
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// API Resource Methods
// ============================================================================

/**
 * Authentication API
 * @description Handles user signup, signin, signout, and session management.
 * Maps to: POST /auth/signup, POST /auth/signin, POST /auth/signout, etc.
 */
export const authApi = {
  /** Register a new user account */
  signup: (data: { email: string; password: string; name?: string }) =>
    api.post("/auth/signup", data),

  /** Authenticate with email and password */
  signin: (data: { email: string; password: string }) =>
    api.post("/auth/signin", data),

  /** End the current session */
  signout: () => api.post("/auth/signout"),

  /** Refresh JWT tokens using refresh token */
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),

  /** Get current authenticated user info and workspaces */
  me: () => api.get("/auth/me"),
};

/**
 * Products API
 * @description CRUD operations for products within the current tenant.
 * Maps to: GET /products, POST /products, PATCH /products/:id, etc.
 */
export const productsApi = {
  /** List products with pagination and optional search */
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/products", { params }),

  /** Get a single product by ID */
  get: (id: string) => api.get(`/products/${id}`),

  /** Create a new product */
  create: (data: unknown) => api.post("/products", data),

  /** Update an existing product (partial update) */
  update: (id: string, data: unknown) => api.patch(`/products/${id}`, data),

  /** Delete a product (soft delete) */
  delete: (id: string) => api.delete(`/products/${id}`),
};

/**
 * Categories API
 * @description Manage product categories within the current tenant.
 * Maps to: GET /categories, POST /categories
 */
export const categoriesApi = {
  /** List all categories for the tenant */
  list: () => api.get("/categories"),

  /** Create a new category */
  create: (data: { name: string; sortOrder?: number }) =>
    api.post("/categories", data),
};

/**
 * Clients API
 * @description Manage business clients (customers) within the current tenant.
 * Maps to: GET /clients, POST /clients
 */
export const clientsApi = {
  /** List clients with pagination and optional search */
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/clients", { params }),

  /** Get a single client by ID */
  get: (id: string) => api.get(`/clients/${id}`),

  /** Create a new client */
  create: (data: unknown) => api.post("/clients", data),
};

/**
 * Orders API
 * @description Manage orders within the current tenant.
 * Maps to: GET /orders, POST /orders
 */
export const ordersApi = {
  /** List orders with pagination and status filter */
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get("/orders", { params }),

  /** Get a single order with full details */
  get: (id: string) => api.get(`/orders/${id}`),

  /** Create a new order (starts in DRAFT status) */
  create: (data: unknown) => api.post("/orders", data),
};
