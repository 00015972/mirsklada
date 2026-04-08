/**
 * @file Stores Module Exports
 * @description Central export point for all Zustand state stores.
 *
 * @module apps/web/src/stores
 *
 * @exports
 * - useAuthStore: Authentication state (user, session, tenants)
 * - useHasHydrated: Hook to check if auth store has hydrated from storage
 * - useThemeStore: Theme state (light/dark mode)
 *
 * @state_management
 * - Uses Zustand for lightweight reactive state
 * - Both stores persist to localStorage
 * - Auth store syncs with Supabase auth state
 */
export { useAuthStore, useHasHydrated } from "./auth.store";
export { useThemeStore } from "./theme.store";
