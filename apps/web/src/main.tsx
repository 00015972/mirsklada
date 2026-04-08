/**
 * @file React Application Entry Point
 * @description Main entry point for the Mirsklada web frontend.
 * Sets up React, routing, authentication, theme management, and toast notifications.
 *
 * @module apps/web/src/main
 *
 * @connections
 * - Uses: ./router (React Router configuration)
 * - Uses: ./stores (Zustand auth and theme stores)
 * - Uses: ./lib/supabase (Supabase client for auth)
 * - Uses: ./lib/i18n (i18next configuration)
 * - Uses: ./styles/globals.css (Tailwind CSS)
 *
 * @responsibilities
 * 1. Mount React application to DOM
 * 2. Initialize Supabase auth listener
 * 3. Handle inactivity timeout (auto-logout after 30 min)
 * 4. Sync auth state across browser tabs
 * 5. Provide themed toast notifications
 *
 * @security
 * - Auto-logout after 30 minutes of inactivity
 * - Session sync across tabs via localStorage events
 * - Immediate logout check on tab visibility change
 */
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { useAuthStore, useThemeStore } from "./stores";
import { supabase } from "./lib/supabase";
import "./lib/i18n";
import {
  AUTH_INACTIVITY_STORAGE_KEY,
  AUTH_INACTIVITY_TIMEOUT_MS,
} from "./stores/auth.store";
import "./styles/globals.css";

/**
 * Auth Initializer Component
 * @description Wrapper component that handles Supabase auth state synchronization
 * and implements inactivity timeout for security.
 *
 * @param {React.ReactNode} children - Child components to render
 *
 * @flow Authentication
 * 1. On mount: Initialize auth state from persisted Zustand store
 * 2. Subscribe to Supabase auth changes (login, logout, token refresh)
 * 3. Sync session state to Zustand store on changes
 *
 * @flow Inactivity Timeout
 * 1. Track last activity timestamp in localStorage
 * 2. Schedule logout after AUTH_INACTIVITY_TIMEOUT_MS (30 min)
 * 3. Reset timer on user activity (clicks, keys, scroll, touch)
 * 4. Check inactivity on tab focus (handle sleeping tabs)
 * 5. Sync activity across tabs via storage events
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, setSession, isAuthenticated, logout } = useAuthStore();

  /**
   * Auth State Initialization Effect
   * @description Initializes auth from persisted state and subscribes to Supabase
   * auth state changes for real-time session updates.
   */
  useEffect(() => {
    // Initialize auth state from Zustand persisted storage and validate with Supabase
    initialize();

    // Subscribe to Supabase auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Session exists - sync to Zustand store
        void setSession(session);
        return;
      }

      if (event === "SIGNED_OUT") {
        // User signed out - clear session
        void setSession(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, setSession]);

  /**
   * Inactivity Timeout Effect
   * @description Implements security feature that logs out users after 30 minutes
   * of inactivity. Activity is tracked across browser tabs.
   */
  useEffect(() => {
    // Skip if not authenticated
    if (!isAuthenticated) {
      return;
    }

    let timeoutId: number | null = null;
    let lastActivityWriteAt = 0;

    /**
     * Persist activity timestamp to localStorage
     * @description Throttled to prevent excessive writes on high-frequency events
     */
    const persistActivity = () => {
      const now = Date.now();

      // Throttle writes to localStorage (max once per 10 seconds)
      if (now - lastActivityWriteAt < 10000) {
        return;
      }

      localStorage.setItem(AUTH_INACTIVITY_STORAGE_KEY, String(now));
      lastActivityWriteAt = now;
    };

    /**
     * Get last activity timestamp from localStorage
     */
    const getLastActivityAt = () => {
      const rawValue = localStorage.getItem(AUTH_INACTIVITY_STORAGE_KEY);
      if (!rawValue) return Date.now();

      const parsed = Number(rawValue);
      return Number.isNaN(parsed) ? Date.now() : parsed;
    };

    /**
     * Check if user has been inactive beyond timeout threshold
     */
    const isInactive = () => {
      return Date.now() - getLastActivityAt() >= AUTH_INACTIVITY_TIMEOUT_MS;
    };

    /**
     * Clear existing timeout if set
     */
    const clearTimeoutIfNeeded = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    /**
     * Schedule automatic logout based on remaining time
     */
    const scheduleTimeout = () => {
      clearTimeoutIfNeeded();

      const elapsed = Date.now() - getLastActivityAt();
      const remaining = Math.max(AUTH_INACTIVITY_TIMEOUT_MS - elapsed, 0);

      timeoutId = window.setTimeout(() => {
        // Double-check auth state before logging out
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().logout();
        }
      }, remaining);
    };

    /**
     * Handler for user activity events
     */
    const onActivity = () => {
      persistActivity();
      scheduleTimeout();
    };

    // Check if already inactive on mount (e.g., returning to stale tab)
    if (isInactive()) {
      logout();
      return;
    }

    // Initialize activity tracking
    persistActivity();
    scheduleTimeout();

    // Activity events that reset the inactivity timer
    const activityEvents: Array<keyof WindowEventMap> = [
      "pointerdown", // Mouse/touch clicks
      "keydown", // Keyboard input
      "scroll", // Page scrolling
      "touchstart", // Mobile touch
    ];

    // Register activity listeners
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true });
    });

    /**
     * Handle tab visibility changes
     * @description Check inactivity when user returns to tab (handles sleeping tabs)
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      // User returned to tab - check if session expired while away
      if (isInactive()) {
        logout();
        return;
      }

      onActivity();
    };

    /**
     * Handle storage events from other tabs
     * @description Sync activity across multiple tabs
     */
    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === AUTH_INACTIVITY_STORAGE_KEY) {
        // Activity in another tab - reschedule our timeout
        scheduleTimeout();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageSync);

    // Cleanup on unmount
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
 * Theme-aware Toaster Component
 * @description Wrapper for react-hot-toast that adapts to the current theme.
 * Provides styled toast notifications positioned at top-right.
 *
 * @styling
 * - Dark mode: Dark background with light text
 * - Light mode: Light background with dark text
 * - Success toasts: Green icon
 * - Error toasts: Red icon
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

/**
 * Application Root Render
 * @description Mounts the React application to the DOM.
 *
 * @structure
 * - StrictMode: Enables additional React checks in development
 * - AuthInitializer: Handles auth state and inactivity timeout
 * - RouterProvider: React Router for navigation
 * - ThemedToaster: Toast notifications
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthInitializer>
      <RouterProvider router={router} />
      <ThemedToaster />
    </AuthInitializer>
  </StrictMode>,
);
