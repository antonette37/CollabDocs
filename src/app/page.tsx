import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateDocumentButton } from "@/components/create-document-button";
import { ImportFileButton } from "@/components/import-file-button";
import { DocumentList } from "@/components/document-list";

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  const [ownedDocuments, sharedDocuments] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: currentUser.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
    prisma.documentShare.findMany({
      where: { sharedWithUserId: currentUser.id },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
            owner: { select: { name: true } },
          },
        },
      },
      orderBy: { document: { updatedAt: "desc" } },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-source-serif)] text-3xl font-semibold tracking-tight text-slate-900">
            Documents
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Signed in as <span className="font-medium text-slate-900">{currentUser.name}</span>.
            Create a blank document, use <strong>Import Document</strong> for a{" "}
            <code className="rounded bg-slate-200/70 px-1">.txt</code> or{" "}
            <code className="rounded bg-slate-200/70 px-1">.md</code> file, or open something
            shared with you.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportFileButton />
          <CreateDocumentButton />
        </div>
      </section>

      <DocumentList
        title="My Documents"
        description="Documents you own"
        documents={ownedDocuments}
        emptyMessage="You have not created any documents yet."
      />

      <DocumentList
        title="Shared with Me"
        description="Documents others have shared with you"
        showOwner
        documents={sharedDocuments.map((share) => ({
          id: share.document.id,
          title: share.document.title,
          updatedAt: share.document.updatedAt,
          ownerName: share.document.owner.name,
          accessLevel: share.accessLevel,
          shared: true,
        }))}
        emptyMessage="Nothing has been shared with you yet."
      />
    </div>
  );
}
