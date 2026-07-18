"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  assertCanEdit,
  assertCanView,
  getDocumentAccess,
} from "@/lib/permissions";
import { filenameToTitle, textOrMarkdownToHtml } from "@/lib/markdown";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function resolveDocumentAccess(documentId: string) {
  const user = await getCurrentUser();
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        where: { sharedWithUserId: user.id },
        take: 1,
      },
    },
  });

  if (!document) {
    return { user, document: null, access: null as ReturnType<typeof getDocumentAccess> | null };
  }

  const access = getDocumentAccess({
    ownerId: document.ownerId,
    currentUserId: user.id,
    share: document.shares[0] ?? null,
  });

  return { user, document, access };
}

export async function createDocument(): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    const document = await prisma.document.create({
      data: {
        title: "Untitled Document",
        content: "<p></p>",
        ownerId: user.id,
      },
    });

    revalidatePath("/");
    return { ok: true, data: { id: document.id } };
  } catch (error) {
    console.error("createDocument failed:", error);
    return { ok: false, error: "Failed to create document" };
  }
}

export async function updateDocument(
  documentId: string,
  data: { title?: string; content?: string },
): Promise<ActionResult> {
  try {
    const { document, access } = await resolveDocumentAccess(documentId);

    if (!document || !access) {
      return { ok: false, error: "Document not found" };
    }

    assertCanEdit(access);

    const title = data.title?.trim();
    if (title !== undefined && title.length === 0) {
      data = { ...data, title: "Untitled Document" };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() || "Untitled Document" } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
      },
    });

    revalidatePath("/");
    revalidatePath(`/documents/${documentId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized access"
        ? "Unauthorized access"
        : "Failed to auto-save";
    console.error("updateDocument failed:", error);
    return { ok: false, error: message };
  }
}

export async function importDocumentContent(
  documentId: string | null,
  payload: { filename: string; text: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    const extension = payload.filename.split(".").pop()?.toLowerCase();

    if (extension !== "txt" && extension !== "md") {
      return {
        ok: false,
        error: "Unsupported file type. Only .txt and .md files are allowed.",
      };
    }

    if (!payload.text.trim()) {
      return { ok: false, error: "The selected file is empty" };
    }

    const html = textOrMarkdownToHtml(payload.text);
    const title = filenameToTitle(payload.filename);

    if (documentId) {
      const { document, access } = await resolveDocumentAccess(documentId);
      if (!document || !access) {
        return { ok: false, error: "Document not found" };
      }
      assertCanEdit(access);

      await prisma.document.update({
        where: { id: documentId },
        data: { title, content: html },
      });

      revalidatePath("/");
      revalidatePath(`/documents/${documentId}`);
      return { ok: true, data: { id: documentId } };
    }

    const document = await prisma.document.create({
      data: {
        title,
        content: html,
        ownerId: user.id,
      },
    });

    revalidatePath("/");
    return { ok: true, data: { id: document.id } };
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized access"
        ? "Unauthorized access"
        : "Failed to import file";
    console.error("importDocumentContent failed:", error);
    return { ok: false, error: message };
  }
}

export async function getDocumentForEditor(documentId: string) {
  const { user, document, access } = await resolveDocumentAccess(documentId);

  if (!document || !access) {
    return { ok: false as const, error: "Document not found" };
  }

  try {
    assertCanView(access);
  } catch {
    return { ok: false as const, error: "Unauthorized access" };
  }

  return {
    ok: true as const,
    data: {
      id: document.id,
      title: document.title,
      content: document.content,
      updatedAt: document.updatedAt.toISOString(),
      owner: document.owner,
      access,
      currentUser: user,
    },
  };
}
