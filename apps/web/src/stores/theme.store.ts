/**
 * @file Theme State Store
 * @description Zustand store for managing light/dark mode theme preferences.
 * Persists to localStorage and syncs with DOM classes for Tailwind CSS dark mode.
 *
 * @module apps/web/src/stores/theme.store
 *
 * @connections
 * - Exported via: ./index.ts
 * - Used by: @/layouts/AppLayout.tsx (theme toggle button)
 * - Used by: @/components/ui/* (theme-aware styling)
 *
 * @persistence
 * - Persisted to localStorage under key "mirsklada-theme"
 * - Default theme: "dark" (per project requirements)
 *
 * @css_integration
 * - Toggles "dark" class on document.documentElement for Tailwind CSS
 * - Updates body className for base background and text colors
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Theme type - limited to light or dark mode */
type Theme = "light" | "dark";

/**
 * Theme State Interface
 * @description Shape of the theme store state and actions
 */
interface ThemeState {
  /** Current theme ("light" or "dark") */
  theme: Theme;
  /** Toggle between light and dark mode */
  toggleTheme: () => void;
  /** Set a specific theme */
  setTheme: (theme: Theme) => void;
}

/**
 * Theme Store
 * @description Zustand store with localStorage persistence.
 * Manages theme state and DOM synchronization.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      /** Default theme is dark (per project requirements) */
      theme: "dark",

      /**
       * Toggle Theme
       * @description Switches between light and dark mode.
       * Updates both the store state and DOM classes.
       */
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        // Update Tailwind CSS dark mode class
        document.documentElement.classList.toggle("dark", next === "dark");
        // Update body base styles
        document.body.className =
          next === "dark"
            ? "bg-surface-950 text-surface-100 antialiased"
            : "bg-white text-surface-900 antialiased";
        set({ theme: next });
      },

      /**
       * Set Theme
       * @description Explicitly set a specific theme.
       * @param theme - The theme to set ("light" or "dark")
       */
      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.body.className =
          theme === "dark"
            ? "bg-surface-950 text-surface-100 antialiased"
            : "bg-white text-surface-900 antialiased";
        set({ theme });
      },
    }),
    {
      /** LocalStorage key for persistence */
      name: "mirsklada-theme",

      /**
       * Rehydration Handler
       * @description Called when state is loaded from localStorage.
       * Syncs the DOM classes with the persisted theme preference.
       */
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            const theme = state.theme;
            // Apply persisted theme to DOM
            document.documentElement.classList.toggle("dark", theme === "dark");
            document.body.className =
              theme === "dark"
                ? "bg-surface-950 text-surface-100 antialiased"
                : "bg-white text-surface-900 antialiased";
          }
        };
      },
    },
  ),
);
