import { PrismaClient } from "@prisma/client";

const globalForDb = globalThis as unknown as {
  collabDocsInitialized?: boolean;
  collabDocsInitPromise?: Promise<void>;
};

/**
 * Ensures seeded demo users/docs exist (safe on shared Postgres).
 * No-op after the first successful init in this process.
 */
export async function ensureDatabaseReady(prisma: PrismaClient): Promise<void> {
  if (globalForDb.collabDocsInitialized) return;

  if (!globalForDb.collabDocsInitPromise) {
    globalForDb.collabDocsInitPromise = seedIfEmpty(prisma)
      .then(() => {
        globalForDb.collabDocsInitialized = true;
      })
      .catch((error) => {
        globalForDb.collabDocsInitPromise = undefined;
        throw error;
      });
  }

  await globalForDb.collabDocsInitPromise;
}

async function seedIfEmpty(prisma: PrismaClient): Promise<void> {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  await prisma.user.createMany({
    data: [
      {
        id: "user-antonette",
        email: "antonette@example.com",
        name: "Antonette",
      },
      {
        id: "user-bob",
        email: "bob@example.com",
        name: "Bob",
      },
      {
        id: "user-charlie",
        email: "charlie@example.com",
        name: "Charlie",
      },
    ],
  });

  const welcomeDoc = await prisma.document.create({
    data: {
      title: "Welcome to CollabDocs",
      content:
        "<h1>Welcome</h1><p>This is a sample document owned by <strong>Antonette</strong>. Try sharing it with Bob or Charlie.</p><ul><li>Create documents</li><li>Edit with rich text</li><li>Share with colleagues</li></ul>",
      ownerId: "user-antonette",
    },
  });

  await prisma.document.create({
    data: {
      title: "Bob's Notes",
      content:
        "<h2>Meeting notes</h2><p>Ideas for the next sprint and a few action items.</p><ol><li>Review sharing permissions</li><li>Polish the editor toolbar</li></ol>",
      ownerId: "user-bob",
    },
  });

  await prisma.documentShare.create({
    data: {
      documentId: welcomeDoc.id,
      sharedWithUserId: "user-bob",
      accessLevel: "edit",
    },
  });
}
