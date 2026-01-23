/**
 * Auth Store - Zustand
 * Manages authentication state
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
  subscriptionTier: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  tenants: Tenant[];
  currentTenantId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, session: Session, tenants: Tenant[]) => void;
  setSession: (
    supabaseSession: {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
    } | null,
  ) => void;
  setLoading: (loading: boolean) => void;
  setTenant: (tenantId: string) => void;
  refreshSession: () => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      tenants: [],
      currentTenantId: null,
      isLoading: true,
      isAuthenticated: false,

      setAuth: (user, session, tenants) => {
        set({
          user,
          session,
          tenants,
          currentTenantId: tenants[0]?.id || null,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setSession: async (supabaseSession) => {
        if (!supabaseSession) {
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

        // Fetch user data from our API
        try {
          const response = await fetch("/api/v1/auth/me", {
            headers: {
              Authorization: `Bearer ${supabaseSession.access_token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            set({
              user: result.user,
              session: {
                accessToken: supabaseSession.access_token,
                refreshToken: supabaseSession.refresh_token,
                expiresAt: supabaseSession.expires_at,
              },
              tenants: result.tenants || [],
              currentTenantId: result.tenants?.[0]?.id || null,
              isAuthenticated: true,
              isLoading: false,
            });
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
        const { tenants } = get();
        if (tenants.some((t) => t.id === tenantId)) {
          set({ currentTenantId: tenantId });
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
        set({ isLoading: true });

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            // Session exists - validate with our API
            const { data } = await supabase.auth.getUser();
            if (data.user) {
              // Fetch user data from our API
              const response = await fetch("/api/v1/auth/me", {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

              if (response.ok) {
                const result = await response.json();
                set({
                  user: result.user,
                  session: {
                    accessToken: session.access_token,
                    refreshToken: session.refresh_token,
                    expiresAt: session.expires_at,
                  },
                  tenants: result.tenants || [],
                  currentTenantId: result.tenants?.[0]?.id || null,
                  isAuthenticated: true,
                });
              }
            }
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "mirsklada-auth",
      partialize: (state) => ({
        session: state.session,
        currentTenantId: state.currentTenantId,
      }),
    },
  ),
);
