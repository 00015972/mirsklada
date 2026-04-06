/**
 * Theme Store - Zustand
 * Manages light/dark mode with localStorage persistence
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",

      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        document.documentElement.classList.toggle("dark", next === "dark");
        document.body.className = next === "dark"
          ? "bg-surface-950 text-surface-100 antialiased"
          : "bg-white text-surface-900 antialiased";
        set({ theme: next });
      },

      setTheme: (theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.body.className = theme === "dark"
          ? "bg-surface-950 text-surface-100 antialiased"
          : "bg-white text-surface-900 antialiased";
        set({ theme });
      },
    }),
    {
      name: "mirsklada-theme",
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            const theme = state.theme;
            document.documentElement.classList.toggle("dark", theme === "dark");
            document.body.className = theme === "dark"
              ? "bg-surface-950 text-surface-100 antialiased"
              : "bg-white text-surface-900 antialiased";
          }
        };
      },
    },
  ),
);
