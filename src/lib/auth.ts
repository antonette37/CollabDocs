import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ensureDatabaseReady } from "@/lib/db-init";
import {
  CURRENT_USER_COOKIE,
  DEFAULT_USER_ID,
  type AuthUser,
} from "@/lib/constants";

async function withDatabase<T>(fn: () => Promise<T>): Promise<T> {
  await ensureDatabaseReady(prisma);
  return fn();
}

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(CURRENT_USER_COOKIE)?.value ?? DEFAULT_USER_ID;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return withDatabase(async () => {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user) {
      return user;
    }

    const fallback = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID },
    });

    if (!fallback) {
      throw new Error(
        "No seeded users found. Run `npx prisma db seed` before starting the app.",
      );
    }

    return fallback;
  });
}

export async function getAllUsers(): Promise<AuthUser[]> {
  return withDatabase(async () =>
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, email: true, name: true },
    }),
  );
}
