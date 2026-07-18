"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  assertCanEdit,
  getDocumentAccess,
  normalizeAccessLevel,
  type AccessLevel,
} from "@/lib/permissions";

export type ShareActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function shareDocument(input: {
  documentId: string;
  sharedWithUserId: string;
  accessLevel: AccessLevel;
}): Promise<ShareActionResult> {
  try {
    const currentUser = await getCurrentUser();
    const document = await prisma.document.findUnique({
      where: { id: input.documentId },
      include: {
        shares: {
          where: { sharedWithUserId: currentUser.id },
          take: 1,
        },
      },
    });

    if (!document) {
      return { ok: false, error: "Document not found" };
    }

    const access = getDocumentAccess({
      ownerId: document.ownerId,
      currentUserId: currentUser.id,
      share: document.shares[0] ?? null,
    });

    if (access.role !== "owner") {
      return { ok: false, error: "Only the document owner can manage sharing" };
    }

    if (input.sharedWithUserId === currentUser.id) {
      return { ok: false, error: "You already own this document" };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.sharedWithUserId },
    });

    if (!targetUser) {
      return { ok: false, error: "Selected user was not found" };
    }

    const accessLevel = normalizeAccessLevel(input.accessLevel);
    if (!accessLevel) {
      return { ok: false, error: "Invalid access level" };
    }

    await prisma.documentShare.upsert({
      where: {
        documentId_sharedWithUserId: {
          documentId: input.documentId,
          sharedWithUserId: input.sharedWithUserId,
        },
      },
      create: {
        documentId: input.documentId,
        sharedWithUserId: input.sharedWithUserId,
        accessLevel,
      },
      update: { accessLevel },
    });

    revalidatePath(`/documents/${input.documentId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("shareDocument failed:", error);
    return { ok: false, error: "Failed to share document" };
  }
}

export async function revokeShare(input: {
  documentId: string;
  sharedWithUserId: string;
}): Promise<ShareActionResult> {
  try {
    const currentUser = await getCurrentUser();
    const document = await prisma.document.findUnique({
      where: { id: input.documentId },
    });

    if (!document) {
      return { ok: false, error: "Document not found" };
    }

    if (document.ownerId !== currentUser.id) {
      return { ok: false, error: "Only the document owner can manage sharing" };
    }

    await prisma.documentShare.deleteMany({
      where: {
        documentId: input.documentId,
        sharedWithUserId: input.sharedWithUserId,
      },
    });

    revalidatePath(`/documents/${input.documentId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("revokeShare failed:", error);
    return { ok: false, error: "Failed to revoke share" };
  }
}

export async function listDocumentShares(documentId: string) {
  const currentUser = await getCurrentUser();
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      shares: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  if (!document) {
    return { ok: false as const, error: "Document not found" };
  }

  if (document.ownerId !== currentUser.id) {
    return { ok: false as const, error: "Only the document owner can view shares" };
  }

  // Touch assertCanEdit for owners via access helper consistency
  const access = getDocumentAccess({
    ownerId: document.ownerId,
    currentUserId: currentUser.id,
    share: null,
  });
  assertCanEdit(access);

  return {
    ok: true as const,
    data: document.shares.map((share) => ({
      id: share.id,
      accessLevel: share.accessLevel,
      user: share.user,
    })),
  };
}
