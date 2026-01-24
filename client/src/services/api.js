import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Axios instance with interceptors
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { response } = error;
    
    // Handle 401 - Unauthorized
    if (response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    // Return standardized error response
    return Promise.resolve({
      success: false,
      error: response?.data?.error || {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error occurred',
      },
    });
  }
);

export default api;
