/**
 * API Client with Auth Interceptors
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.store";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { session, currentTenantId } = useAuthStore.getState();

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    if (currentTenantId) {
      config.headers["x-tenant-id"] = currentTenantId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      (originalRequest as any)._retry = true;

      try {
        const { session, refreshSession, logout } = useAuthStore.getState();

        if (session?.refreshToken) {
          await refreshSession();
          const newSession = useAuthStore.getState().session;

          if (newSession?.accessToken) {
            originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
            return api(originalRequest);
          }
        }

        // Refresh failed - logout
        logout();
      } catch {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  },
);

// API methods
export const authApi = {
  signup: (data: { email: string; password: string; name?: string }) =>
    api.post("/auth/signup", data),

  signin: (data: { email: string; password: string }) =>
    api.post("/auth/signin", data),

  signout: () => api.post("/auth/signout"),

  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),

  me: () => api.get("/auth/me"),
};

export const productsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/products", { params }),

  get: (id: string) => api.get(`/products/${id}`),

  create: (data: any) => api.post("/products", data),

  update: (id: string, data: any) => api.patch(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),
};

export const categoriesApi = {
  list: () => api.get("/categories"),

  create: (data: { name: string; sortOrder?: number }) =>
    api.post("/categories", data),
};

export const clientsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/clients", { params }),

  get: (id: string) => api.get(`/clients/${id}`),

  create: (data: any) => api.post("/clients", data),
};

export const ordersApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get("/orders", { params }),

  get: (id: string) => api.get(`/orders/${id}`),

  create: (data: any) => api.post("/orders", data),
};
