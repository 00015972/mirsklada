/**
 * @file Authentication State Store
 * @description Zustand store for managing authentication state including user data,
 * session tokens, workspace/tenant information, and loading states.
 * Persists to localStorage for session continuity across page refreshes.
 *
 * @module apps/web/src/stores/auth.store
 *
 * @connections
 * - Uses: @/lib/supabase (Supabase client for auth operations)
 * - Exported via: ./index.ts
 * - Used by: ./main.tsx (AuthInitializer), @/components/ProtectedRoute
 * - Used by: @/lib/api.ts (Authorization headers)
 * - Used by: All protected pages and components
 *
 * @persistence
 * - Persisted to localStorage under key "mirsklada-auth"
 * - Partial state: user, session, tenants, currentTenantId, isAuthenticated
 * - isLoading is NOT persisted (always starts true, set false after hydration)
 *
 * @security
 * - Tokens are stored in localStorage (standard Supabase pattern)
 * - Inactivity timeout handled via AUTH_INACTIVITY_STORAGE_KEY
 * - Session refresh via Supabase auth.refreshSession()
 */
import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

/**
 * Inactivity Timeout Configuration
 * @description After 30 minutes of no user activity, the session is logged out.
 * Activity is tracked in localStorage for cross-tab synchronization.
 */
export const AUTH_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const AUTH_INACTIVITY_STORAGE_KEY = "mirsklada-last-activity-at";

/**
 * User Interface
 * @description Represents the authenticated user's basic information
 */
interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

/**
 * Session Interface
 * @description Contains JWT tokens for API authentication
 */
interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

/**
 * Tenant/Workspace Interface
 * @description Represents a workspace the user has access to.
 * Users can belong to multiple tenants with different roles.
 */
interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string; // "OWNER", "ADMIN", "MEMBER"
  subscriptionTier: string; // "FREE", "PRO", "ENTERPRISE"
}

/**
 * Auth State Interface
 * @description Complete authentication state shape including all actions
 */
interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  tenants: Tenant[];
  currentTenantId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, session: Session, tenants: Tenant[]) => Promise<void>;
  setSession: (
    supabaseSession: {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
    } | null,
  ) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setTenant: (tenantId: string) => void;
  updateTenantName: (tenantId: string, name: string) => void;
  updateTenantTier: (tenantId: string, tier: string) => void;
  refreshTenants: () => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

/**
 * Auth Store
 * @description Zustand store with localStorage persistence.
 * Manages all authentication-related state and actions.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      tenants: [],
      currentTenantId: null,
      isLoading: true,
      isAuthenticated: false,

      setAuth: async (user, session, tenants) => {
        // Keep Supabase client session in sync with backend-issued tokens.
        // This prevents losing auth state on full page refresh.
        try {
          await supabase.auth.setSession({
            access_token: session.accessToken,
            refresh_token: session.refreshToken,
          });
        } catch (error) {
          console.warn(
            "Failed to sync Supabase session from backend login",
            error,
          );
        }

        localStorage.setItem(
          AUTH_INACTIVITY_STORAGE_KEY,
          Date.now().toString(),
        );

        const previousTenantId = get().currentTenantId;
        const resolvedTenantId = tenants.some((t) => t.id === previousTenantId)
          ? previousTenantId
          : tenants[0]?.id || null;

        set({
          user,
          session,
          tenants,
          currentTenantId: resolvedTenantId,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setSession: async (supabaseSession) => {
        if (!supabaseSession) {
          localStorage.removeItem(AUTH_INACTIVITY_STORAGE_KEY);
          set({
            user: null,
            session: null,
            tenants: [],
            currentTenantId: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        localStorage.setItem(
          AUTH_INACTIVITY_STORAGE_KEY,
          Date.now().toString(),
        );

        const newSession = {
          accessToken: supabaseSession.access_token,
          refreshToken: supabaseSession.refresh_token,
          expiresAt: supabaseSession.expires_at,
        };

        // Only show loading screen on first login — skip it on token refreshes
        // so that tab switches (which trigger TOKEN_REFRESHED) don't flash the UI.
        const alreadyAuthenticated = get().isAuthenticated;
        set({
          session: newSession,
          isAuthenticated: true,
          isLoading: !alreadyAuthenticated,
        });

        // Fetch user data from our API
        try {
          const response = await fetch("/api/v1/auth/me", {
            headers: {
              Authorization: `Bearer ${supabaseSession.access_token}`,
              "Cache-Control": "no-cache",
            },
          });

          if (response.ok) {
            const result = await response.json();
            const updatedTenants: Tenant[] = result.tenants || [];
            const previousTenantId = get().currentTenantId;
            const resolvedTenantId = updatedTenants.some(
              (t) => t.id === previousTenantId,
            )
              ? previousTenantId
              : updatedTenants[0]?.id || null;
            set({
              user: result.user,
              session: newSession,
              tenants: updatedTenants,
              currentTenantId: resolvedTenantId,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          set({ isLoading: false });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setTenant: (tenantId) => {
        const { tenants, currentTenantId } = get();
        if (
          tenants.some((t) => t.id === tenantId) &&
          tenantId !== currentTenantId
        ) {
          set({ currentTenantId: tenantId });
          // Force reload to fetch fresh data for the new workspace
          window.location.reload();
        }
      },

      updateTenantName: (tenantId, name) => {
        const { tenants } = get();
        set({
          tenants: tenants.map((t) => (t.id === tenantId ? { ...t, name } : t)),
        });
      },

      updateTenantTier: (tenantId, tier) => {
        const { tenants } = get();
        set({
          tenants: tenants.map((t) =>
            t.id === tenantId ? { ...t, subscriptionTier: tier } : t,
          ),
        });
      },

      refreshTenants: async () => {
        const { session, currentTenantId } = get();
        if (!session?.accessToken) return;
        try {
          const response = await fetch("/api/v1/auth/me", {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              "Cache-Control": "no-cache",
            },
          });
          if (response.ok) {
            const result = await response.json();
            const updatedTenants: Tenant[] = result.tenants || [];
            set({
              tenants: updatedTenants,
              currentTenantId: updatedTenants.some((t) => t.id === currentTenantId)
                ? currentTenantId
                : updatedTenants[0]?.id || null,
            });
          }
        } catch (error) {
          console.error("Failed to refresh tenants:", error);
        }
      },

      refreshSession: async () => {
        const { session } = get();
        if (!session?.refreshToken) return;

        try {
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: session.refreshToken,
          });

          if (error || !data.session) {
            throw error;
          }

          set({
            session: {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at,
            },
          });
        } catch {
          get().logout();
        }
      },

      logout: () => {
        supabase.auth.signOut();
        localStorage.removeItem(AUTH_INACTIVITY_STORAGE_KEY);
        set({
          user: null,
          session: null,
          tenants: [],
          currentTenantId: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      initialize: async () => {
        const currentState = get();

        // If we already have a valid session from persistence, don't show loading
        // Just validate in the background
        if (!currentState.session?.accessToken) {
          set({ isLoading: true });
        }

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            await get().setSession(session);
            return;
          }

          // Fallback: restore Supabase client session from persisted Zustand auth.
          // This covers backend-first login flows that don't directly call supabase.auth.signIn* on the web client.
          if (
            currentState.session?.accessToken &&
            currentState.session.refreshToken
          ) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: currentState.session.accessToken,
                refresh_token: currentState.session.refreshToken,
              });

              if (error) {
                throw error;
              }

              if (data.session) {
                await get().setSession(data.session);
                return;
              }
            } catch (restoreError) {
              console.warn(
                "Failed to restore Supabase session from persisted auth",
                restoreError,
              );
            }
          }

          // No valid session - clear auth state
          localStorage.removeItem(AUTH_INACTIVITY_STORAGE_KEY);
          set({
            user: null,
            session: null,
            tenants: [],
            currentTenantId: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error("Auth initialization failed:", error);
          // On error, if we have a persisted session, keep user authenticated
          // to prevent disruption. The session might still be valid.
          if (!currentState.session?.accessToken) {
            set({ isLoading: false });
          } else {
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: "mirsklada-auth",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        tenants: state.tenants,
        currentTenantId: state.currentTenantId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error("Failed to rehydrate auth store:", error);
            state?.setLoading(false);
            return;
          }

          // After rehydration, if we have a persisted session, keep isAuthenticated true
          // and keep isLoading true so ProtectedRoute shows loading spinner
          // until initialize() completes validation
          if (state?.session?.accessToken && state?.isAuthenticated) {
            // Keep the user authenticated during revalidation
            // isLoading remains true (default) until initialize() completes
            // This prevents the flash of redirect to login
          } else if (!state?.session?.accessToken) {
            // No session stored, user needs to login
            state?.setLoading(false);
          }
        };
      },
    },
  ),
);

// Hook to check if store has been hydrated
export const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Subscribe to hydration
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hasHydrated;
};
