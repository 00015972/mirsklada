/**
 * @file Environment Configuration
 * @description Validates and exports environment variables using Zod schema.
 * All environment variables are validated at application startup - if validation
 * fails, the process exits immediately with an error message.
 *
 * @module apps/api/src/config/env
 *
 * @connections
 * - Uses: dotenv/config (loads .env file)
 * - Uses: zod (schema validation)
 * - Exported via: ./index.ts
 * - Used by: All modules that need configuration values
 *
 * @environment_variables
 * - NODE_ENV: development | production | test
 * - PORT: HTTP server port (default: 3000)
 * - DATABASE_URL: PostgreSQL connection string
 * - SUPABASE_*: Supabase authentication configuration
 * - RATE_LIMIT_*: Rate limiting configuration
 * - CORS_ORIGIN: Allowed CORS origins (comma-separated)
 */
import "dotenv/config";
import { z } from "zod";

/**
 * Environment Variables Schema
 * @description Zod schema that defines and validates all environment variables.
 * Variables marked as optional() allow the app to start without them (useful for development).
 * Variables with default() will use the default value if not provided.
 */
const envSchema = z.object({
  // ═══════════════════════════════════════════════════════════════════
  // General Application Settings
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Node.js environment mode
   * @default "development"
   */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  /**
   * HTTP server port
   * @default 3000
   */
  PORT: z.string().default("3000").transform(Number),

  // ═══════════════════════════════════════════════════════════════════
  // Database Configuration
  // ═══════════════════════════════════════════════════════════════════

  /**
   * PostgreSQL connection string for Prisma
   * Format: postgresql://user:password@host:port/database
   * @optional During initial setup only
   */
  DATABASE_URL: z.string().url().optional(),

  // ═══════════════════════════════════════════════════════════════════
  // Supabase Authentication
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Supabase project URL
   * @example "https://xxxxx.supabase.co"
   */
  SUPABASE_URL: z.string().url().optional(),

  /**
   * Supabase anonymous (public) key - respects RLS policies
   */
  SUPABASE_ANON_KEY: z.string().optional(),

  /**
   * Supabase service role key - bypasses RLS (use carefully!)
   */
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // ═══════════════════════════════════════════════════════════════════
  // Alternative JWT Authentication
  // ═══════════════════════════════════════════════════════════════════

  /**
   * JWT secret for signing tokens (if not using Supabase)
   */
  JWT_SECRET: z.string().optional(),

  // ═══════════════════════════════════════════════════════════════════
  // Security & Encryption
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Encryption key for sensitive data (OAuth tokens, etc.)
   * Must be at least 32 characters
   */
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // ═══════════════════════════════════════════════════════════════════
  // Google Drive Integration
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Google OAuth client ID for Drive integration
   */
  GOOGLE_CLIENT_ID: z.string().optional(),

  /**
   * Google OAuth client secret
   */
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ═══════════════════════════════════════════════════════════════════
  // RevenueCat Billing Webhooks
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Shared secret used to authenticate RevenueCat webhook requests.
   */
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),

  // ═══════════════════════════════════════════════════════════════════
  // Rate Limiting
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Rate limit window in milliseconds
   * @default 60000 (1 minute)
   */
  RATE_LIMIT_WINDOW_MS: z.string().default("60000").transform(Number),

  /**
   * Maximum requests per window per IP
   * @default 100
   */
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),

  // ═══════════════════════════════════════════════════════════════════
  // CORS Configuration
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Allowed CORS origins (comma-separated for multiple)
   * @default "http://localhost:5173" (Vite dev server)
   */
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

/**
 * Parse and Validate Environment Variables
 * @description Parses process.env against the schema. If validation fails,
 * logs detailed error information and exits the process with code 1.
 *
 * @returns {z.infer<typeof envSchema>} Validated and transformed environment object
 *
 * @throws Process exits with code 1 if validation fails
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

/**
 * Validated Environment Variables
 * @description Exported object containing all validated environment variables.
 * Safe to use throughout the application - all values are guaranteed to match
 * the schema or have sensible defaults.
 */
export const env = parseEnv();

/**
 * Environment Type Export
 * @description TypeScript type inferred from the Zod schema.
 * Use for type-safe access to environment variables.
 */
export type Env = z.infer<typeof envSchema>;
