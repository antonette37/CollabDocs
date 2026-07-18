import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.documentShare.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  const antonette = await prisma.user.create({
    data: {
      id: "user-antonette",
      email: "antonette@example.com",
      name: "Antonette",
    },
  });

  const bob = await prisma.user.create({
    data: {
      id: "user-bob",
      email: "bob@example.com",
      name: "Bob",
    },
  });

  await prisma.user.create({
    data: {
      id: "user-charlie",
      email: "charlie@example.com",
      name: "Charlie",
    },
  });

  const welcomeDoc = await prisma.document.create({
    data: {
      title: "Welcome to CollabDocs",
      content:
        "<h1>Welcome</h1><p>This is a sample document owned by <strong>Antonette</strong>. Try sharing it with Bob or Charlie.</p><ul><li>Create documents</li><li>Edit with rich text</li><li>Share with colleagues</li></ul>",
      ownerId: antonette.id,
    },
  });

  await prisma.document.create({
    data: {
      title: "Bob's Notes",
      content:
        "<h2>Meeting notes</h2><p>Ideas for the next sprint and a few action items.</p><ol><li>Review sharing permissions</li><li>Polish the editor toolbar</li></ol>",
      ownerId: bob.id,
    },
  });

  await prisma.documentShare.create({
    data: {
      documentId: welcomeDoc.id,
      sharedWithUserId: bob.id,
      accessLevel: "edit",
    },
  });

  console.log("Seeded users: Antonette, Bob, Charlie");
  console.log("Seeded sample documents and one share (Antonette → Bob, edit)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
