/**
 * @file Configuration Module Exports
 * @description Central export point for all configuration modules.
 * Provides environment variables and Supabase client utilities.
 *
 * @module apps/api/src/config
 *
 * @exports
 * - env: Validated environment variables
 * - Env: TypeScript type for environment object
 * - getSupabase: Get Supabase client (respects RLS)
 * - getSupabaseAdmin: Get admin Supabase client (bypasses RLS)
 * - verifyToken: Verify JWT token and get user
 * - isSupabaseConfigured: Check if Supabase is set up
 * - SupabaseUser: Type alias for Supabase User
 *
 * @usage
 * ```typescript
 * import { env, getSupabase, verifyToken } from './config';
 * ```
 */
export { env, type Env } from "./env";
export {
  getSupabase,
  getSupabaseAdmin,
  verifyToken,
  isSupabaseConfigured,
  type SupabaseUser,
} from "./supabase";
