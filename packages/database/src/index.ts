/**
 * @mirsklada/database
 * Prisma client with multi-tenant patterns
 */

import { PrismaClient, Prisma } from "@prisma/client";

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client instance with logging configuration
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma types and utilities
export { Prisma, PrismaClient };

// Re-export all generated types
export * from "@prisma/client";

/**
 * Type helper for transaction client
 */
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Helper to set tenant context for RLS (when using raw queries with RLS)
 * Call this before executing queries that rely on RLS policies
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
}

/**
 * Disconnect Prisma client (for graceful shutdown)
 */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Check database connectivity
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
