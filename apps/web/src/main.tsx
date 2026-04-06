import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { useAuthStore, useThemeStore } from "./stores";
import { supabase } from "./lib/supabase";
import {
  AUTH_INACTIVITY_STORAGE_KEY,
  AUTH_INACTIVITY_TIMEOUT_MS,
} from "./stores/auth.store";
import "./styles/globals.css";

/**
 * Auth Initializer Component
 * Handles Supabase auth state synchronization
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, setSession, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from Supabase session
    initialize();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        void setSession(session);
        return;
      }

      if (event === "SIGNED_OUT") {
        void setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, setSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let timeoutId: number | null = null;
    let lastActivityWriteAt = 0;

    const persistActivity = () => {
      const now = Date.now();

      // Throttle writes to localStorage on high-frequency events.
      if (now - lastActivityWriteAt < 10000) {
        return;
      }

      localStorage.setItem(AUTH_INACTIVITY_STORAGE_KEY, String(now));
      lastActivityWriteAt = now;
    };

    const getLastActivityAt = () => {
      const rawValue = localStorage.getItem(AUTH_INACTIVITY_STORAGE_KEY);
      if (!rawValue) return Date.now();

      const parsed = Number(rawValue);
      return Number.isNaN(parsed) ? Date.now() : parsed;
    };

    const isInactive = () => {
      return Date.now() - getLastActivityAt() >= AUTH_INACTIVITY_TIMEOUT_MS;
    };

    const clearTimeoutIfNeeded = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    const scheduleTimeout = () => {
      clearTimeoutIfNeeded();

      const elapsed = Date.now() - getLastActivityAt();
      const remaining = Math.max(AUTH_INACTIVITY_TIMEOUT_MS - elapsed, 0);

      timeoutId = window.setTimeout(() => {
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().logout();
        }
      }, remaining);
    };

    const onActivity = () => {
      persistActivity();
      scheduleTimeout();
    };

    if (isInactive()) {
      logout();
      return;
    }

    persistActivity();
    scheduleTimeout();

    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (isInactive()) {
        logout();
        return;
      }

      onActivity();
    };

    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === AUTH_INACTIVITY_STORAGE_KEY) {
        scheduleTimeout();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageSync);

    return () => {
      clearTimeoutIfNeeded();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageSync);
    };
  }, [isAuthenticated, logout]);

  return <>{children}</>;
}

/**
 * Theme-aware Toaster wrapper
 */
function ThemedToaster() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? "#1e1e2e" : "#ffffff",
          color: isDark ? "#e2e8f0" : "#1e293b",
          border: isDark ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
          borderRadius: "0.75rem",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: isDark ? "#1e1e2e" : "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: isDark ? "#1e1e2e" : "#ffffff",
          },
        },
      }}
    />
  );
}

// Root render
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthInitializer>
      <RouterProvider router={router} />
      <ThemedToaster />
    </AuthInitializer>
  </StrictMode>,
);
