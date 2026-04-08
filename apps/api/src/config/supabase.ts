/**
 * @file Supabase Client Configuration
 * @description Provides singleton Supabase clients for authentication and user management.
 * Two client types are available:
 * 1. Regular client (anon key) - respects Row Level Security (RLS) policies
 * 2. Admin client (service role key) - bypasses RLS for server-side operations
 *
 * @module apps/api/src/config/supabase
 *
 * @connections
 * - Imports: ./env (Supabase credentials), ../utils/logger
 * - Exported via: ./index.ts
 * - Used by: ./middleware/auth.middleware.ts (token verification)
 * - Used by: ./modules/auth/* (user authentication)
 *
 * @security
 * - Service role key bypasses ALL security policies - use with extreme caution
 * - Never expose service role key to client-side code
 * - Tokens are verified server-side via getUser() API call
 */
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Singleton client instances
 * @description Cached client instances to avoid creating multiple connections.
 * Initialized lazily on first access.
 */
let supabaseClient: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase Client (User Operations)
 * @description Returns a Supabase client configured with the anonymous key.
 * This client respects Row Level Security (RLS) policies, making it safe
 * for operations where user permissions should be enforced.
 *
 * @returns {SupabaseClient} Configured Supabase client instance
 *
 * @throws {Error} If SUPABASE_URL or SUPABASE_ANON_KEY are not configured
 *
 * @usage
 * ```typescript
 * const supabase = getSupabase();
 * const { data, error } = await supabase.auth.getUser(token);
 * ```
 *
 * @see https://supabase.com/docs/guides/auth
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabaseClient) {
    // Validate required configuration
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      throw new Error(
        "Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY",
      );
    }

    // Create client with server-optimized settings
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false, // Server doesn't need auto-refresh
        persistSession: false, // No session persistence on server
        detectSessionInUrl: false, // Not applicable for API server
      },
    });

    logger.info("Supabase client initialized");
  }

  return supabaseClient;
};

/**
 * Get Supabase Admin Client (Server Operations)
 * @description Returns a Supabase client configured with the service role key.
 * This client BYPASSES all Row Level Security (RLS) policies, allowing
 * unrestricted access to all data.
 *
 * @warning Use with extreme caution! This client can access/modify ANY data.
 *
 * @returns {SupabaseClient} Admin Supabase client instance
 *
 * @throws {Error} If SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are not configured
 *
 * @usage
 * Only use when you need to:
 * - Create users on behalf of others
 * - Access data across tenants (e.g., admin operations)
 * - Perform migrations or bulk operations
 *
 * @see https://supabase.com/docs/guides/auth/server-side-rendering
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdmin) {
    // Validate required configuration
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Supabase admin configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      );
    }

    // Create admin client
    supabaseAdmin = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    logger.info("Supabase admin client initialized");
  }

  return supabaseAdmin;
};

/**
 * Verify JWT Token
 * @description Verifies a Supabase JWT token and returns the associated user.
 * This is the primary method for authenticating API requests.
 *
 * @param {string} token - JWT access token from Authorization header
 *
 * @returns {Promise<{user: User | null, error: Error | null}>}
 * - On success: { user: User, error: null }
 * - On failure: { user: null, error: Error }
 *
 * @usage
 * ```typescript
 * const { user, error } = await verifyToken(accessToken);
 * if (error) {
 *   throw new AppError('Invalid token', 401);
 * }
 * req.userId = user.id;
 * ```
 *
 * @flow
 * 1. Get Supabase client
 * 2. Call auth.getUser() with the token
 * 3. Return user if valid, error if invalid
 */
export const verifyToken = async (
  token: string,
): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const supabase = getSupabase();

    // Verify token by getting user from Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      return { user: null, error: new Error(error.message) };
    }

    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error:
        error instanceof Error ? error : new Error("Token verification failed"),
    };
  }
};

/**
 * Check Supabase Configuration
 * @description Checks if Supabase is properly configured for this environment.
 * Useful for conditional authentication flows (e.g., bypass auth in development).
 *
 * @returns {boolean} True if both SUPABASE_URL and SUPABASE_ANON_KEY are set
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
};

/**
 * Supabase User Type Export
 * @description Re-exports Supabase User type for use in other modules.
 */
export type { User as SupabaseUser };
