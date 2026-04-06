/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Redirects to onboarding if no tenant and requireTenant is true
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, useHasHydrated } from "@/stores";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, redirects to onboarding when user has no tenants */
  requireTenant?: boolean;
}

export function ProtectedRoute({
  children,
  requireTenant = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, tenants, currentTenantId } =
    useAuthStore();
  const location = useLocation();
  const hasHydrated = useHasHydrated();

  // Show loading spinner while hydrating or checking auth state
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-surface-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if tenant is required but user has no tenants
  if (requireTenant && (!tenants || tenants.length === 0 || !currentTenantId)) {
    // Don't redirect if already on onboarding
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Redirect away from onboarding if user already has a tenant
  if (!requireTenant && tenants && tenants.length > 0 && currentTenantId) {
    if (location.pathname === "/onboarding") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
