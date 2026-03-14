import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuthStore } from "./stores";
import { supabase } from "./lib/supabase";
import "./styles/globals.css";

/**
 * Auth Initializer Component
 * Handles Supabase auth state synchronization
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, setSession } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from Supabase session
    initialize();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
      } else {
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, setSession]);

  return <>{children}</>;
}

// Root render
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthInitializer>
      <RouterProvider router={router} />
    </AuthInitializer>
  </StrictMode>,
);
