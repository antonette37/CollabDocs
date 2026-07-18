import { existsSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const TMP_DB = "/tmp/collabdocs.db";

const globalForDb = globalThis as unknown as {
  collabDocsInitialized?: boolean;
  collabDocsInitPromise?: Promise<void>;
};

export function configureVercelDatabaseUrl(): void {
  if (!process.env.VERCEL) return;

  if (!existsSync(TMP_DB)) {
    writeFileSync(TMP_DB, "");
  }

  process.env.DATABASE_URL = `file:${TMP_DB}`;
}

export async function ensureDatabaseReady(prisma: PrismaClient): Promise<void> {
  if (!process.env.VERCEL) return;
  if (globalForDb.collabDocsInitialized) return;

  if (!globalForDb.collabDocsInitPromise) {
    globalForDb.collabDocsInitPromise = initializeVercelDatabase(prisma).then(
      () => {
        globalForDb.collabDocsInitialized = true;
      },
    );
  }

  await globalForDb.collabDocsInitPromise;
}

async function initializeVercelDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Document" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL DEFAULT '',
      "ownerId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Document_ownerId_fkey"
        FOREIGN KEY ("ownerId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DocumentShare" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "documentId" TEXT NOT NULL,
      "sharedWithUserId" TEXT NOT NULL,
      "accessLevel" TEXT NOT NULL,
      CONSTRAINT "DocumentShare_documentId_fkey"
        FOREIGN KEY ("documentId") REFERENCES "Document" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "DocumentShare_sharedWithUserId_fkey"
        FOREIGN KEY ("sharedWithUserId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "DocumentShare_documentId_sharedWithUserId_key"
     ON "DocumentShare"("documentId", "sharedWithUserId");`,
  );

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
