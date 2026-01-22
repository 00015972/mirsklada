/**
 * Supabase Client Configuration
 * Provides authenticated client for user management
 */
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { env } from "./env";
import { logger } from "../utils/logger";

let supabaseClient: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase client for user operations
 * Uses anon key - respects RLS policies
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabaseClient) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      throw new Error(
        "Supabase configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY",
      );
    }

    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    logger.info("Supabase client initialized");
  }

  return supabaseClient;
};

/**
 * Get Supabase admin client for server-side operations
 * Uses service role key - bypasses RLS
 * Use with caution!
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdmin) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Supabase admin configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      );
    }

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
 * Verify a JWT token and return the user
 */
export const verifyToken = async (
  token: string,
): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const supabase = getSupabase();

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
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
};

export type { User as SupabaseUser };
