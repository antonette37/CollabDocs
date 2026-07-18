import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  CURRENT_USER_COOKIE,
  DEFAULT_USER_ID,
  type AuthUser,
} from "@/lib/constants";

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(CURRENT_USER_COOKIE)?.value ?? DEFAULT_USER_ID;
}

export async function getCurrentUser(): Promise<AuthUser> {
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
}

export async function getAllUsers(): Promise<AuthUser[]> {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, email: true, name: true },
  });
}
