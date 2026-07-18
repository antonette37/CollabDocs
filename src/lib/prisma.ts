import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  collabDocsDbReady?: boolean;
};

/**
 * Vercel’s serverless filesystem is read-only except `/tmp`.
 * During `npm run build` we create/seed `prisma/dev.db`, then copy it
 * into `/tmp` on cold start so Prisma can open a writable SQLite file.
 */
function ensureVercelDatabase(): void {
  if (!process.env.VERCEL || globalForPrisma.collabDocsDbReady) {
    return;
  }

  const tmpDbPath = "/tmp/collabdocs.db";
  const bundledCandidates = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "dev.db"),
  ];

  if (!existsSync(tmpDbPath)) {
    const source = bundledCandidates.find((candidate) => existsSync(candidate));
    if (!source) {
      throw new Error(
        "SQLite database missing in the serverless bundle. Ensure the Vercel build runs prisma db push + seed and that prisma/dev.db is included via outputFileTracingIncludes.",
      );
    }
    copyFileSync(source, tmpDbPath);
  }

  process.env.DATABASE_URL = `file:${tmpDbPath}`;
  globalForPrisma.collabDocsDbReady = true;
}

ensureVercelDatabase();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
