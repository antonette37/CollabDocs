export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { prisma } = await import("@/lib/prisma");
  const { ensureDatabaseReady } = await import("@/lib/db-init");
  await ensureDatabaseReady(prisma);
}
