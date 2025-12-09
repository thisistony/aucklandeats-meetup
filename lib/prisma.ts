import { PrismaClient } from '@prisma/client'

// Prefer the Prisma-ready connection string first (Vercel Postgres),
// then fall back to a general DATABASE_URL. This prevents runtime
// failures when only the Vercel-provided env vars are configured.
const databaseUrl =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL

if (!databaseUrl) {
  // Surface a clearer error instead of a generic 500 from Prisma.
  throw new Error('Database connection string is not configured')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
