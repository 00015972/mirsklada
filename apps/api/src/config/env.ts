/**
 * Environment Configuration
 * Validates and exports environment variables with Zod
 */
import { z } from "zod";

const envSchema = z.object({
  // General
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000").transform(Number),

  // Database
  DATABASE_URL: z.string().url().optional(), // Optional for now during setup

  // Auth (Supabase) - Optional during development
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // JWT (alternative to Supabase)
  JWT_SECRET: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // Telegram Bots
  TELEGRAM_ADMIN_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CLIENT_BOT_TOKEN: z.string().optional(),
  BOT_API_SECRET: z.string().optional(),

  // Google Drive
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("60000").transform(Number), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"), // Vite default port
});

// Parse and validate environment
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();

// Type export for use elsewhere
export type Env = z.infer<typeof envSchema>;
