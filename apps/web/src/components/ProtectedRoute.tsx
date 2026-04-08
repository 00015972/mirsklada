/**
 * @file Protected Route Component
 * @description Route guard that protects pages requiring authentication.
 * Handles loading states, authentication checks, and tenant requirements.
 *
 * @module apps/web/src/components/ProtectedRoute
 *
 * @connections
 * - Exported via: ./index.ts
 * - Uses: @/stores (useAuthStore, useHasHydrated)
 * - Uses: react-router-dom (Navigate, useLocation)
 * - Used by: @/router.tsx (wraps protected routes)
 *
 * @behavior
 * 1. Shows loading spinner while auth state is hydrating
 * 2. Redirects to /login if user is not authenticated
 * 3. Redirects to /onboarding if requireTenant=true and user has no tenants
 * 4. Redirects away from /onboarding if user already has a tenant
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, useHasHydrated } from "@/stores";
import { Loader2 } from "lucide-react";

/**
 * Protected Route Props
 */
interface ProtectedRouteProps {
  /** Child components to render if authorized */
  children: React.ReactNode;
  /** If true, redirects to onboarding when user has no tenants (default: true) */
  requireTenant?: boolean;
}

/**
 * ProtectedRoute Component
 * @description Wraps routes that require authentication.
 * Provides loading state, auth check, and tenant validation.
 *
 * @example
 * // Standard protected route (requires auth + tenant)
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 * } />
 *
 * // Onboarding route (requires auth but NOT tenant)
 * <Route path="/onboarding" element={
 *   <ProtectedRoute requireTenant={false}>
 *     <OnboardingPage />
 *   </ProtectedRoute>
 * } />
 */
export function ProtectedRoute({
  children,
  requireTenant = true,
}: ProtectedRouteProps) {
  // Get auth state from Zustand store
  const { isAuthenticated, isLoading, tenants, currentTenantId } =
    useAuthStore();
  const location = useLocation();
  // Check if Zustand store has rehydrated from localStorage
  const hasHydrated = useHasHydrated();

  // LOADING STATE: Show spinner while hydrating or checking auth
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-surface-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // NOT AUTHENTICATED: Redirect to login, preserving intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // NO TENANT: Redirect to onboarding if tenant is required
  if (requireTenant && (!tenants || tenants.length === 0 || !currentTenantId)) {
    // Don't redirect if already on onboarding page
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // HAS TENANT: Redirect away from onboarding if user already has a tenant
  if (!requireTenant && tenants && tenants.length > 0 && currentTenantId) {
    if (location.pathname === "/onboarding") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // AUTHORIZED: Render the protected content
  return <>{children}</>;
}
