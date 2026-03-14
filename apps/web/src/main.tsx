import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e1e2e",
            color: "#e2e8f0",
            border: "1px solid #2d2d3f",
            borderRadius: "0.75rem",
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#1e1e2e" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#1e1e2e" },
          },
        }}
      />
    </AuthInitializer>
  </StrictMode>,
);
