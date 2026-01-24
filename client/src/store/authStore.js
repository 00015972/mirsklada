import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';

/**
 * Auth Store - Manages authentication state
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      /**
       * Set user data
       */
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      /**
       * Set auth token
       */
      setToken: (token) => set({ token }),

      /**
       * Login user
       */
      login: async (email, password) => {
        const response = await authService.login(email, password);
        if (response.success) {
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
          });
        }
        return response;
      },

      /**
       * Register user
       */
      register: async (data) => {
        const response = await authService.register(data);
        if (response.success) {
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
          });
        }
        return response;
      },

      /**
       * Logout user
       */
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      /**
       * Check auth status
       */
      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const response = await authService.getProfile();
          if (response.success) {
            set({ user: response.data.user, isAuthenticated: true });
          } else {
            set({ user: null, token: null, isAuthenticated: false });
          }
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Check if user has role
       */
      hasRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        if (typeof roles === 'string') return user.role === roles;
        return roles.includes(user.role);
      },

      /**
       * Check if user is owner
       */
      isOwner: () => get().user?.role === 'owner',

      /**
       * Check if user is manager or above
       */
      isManagerOrAbove: () => ['owner', 'warehouse_manager'].includes(get().user?.role),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
