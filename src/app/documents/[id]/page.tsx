import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentForEditor } from "@/app/actions/documents";
import { getAllUsers } from "@/lib/auth";
import { DocumentEditor } from "@/components/editor/document-editor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, users] = await Promise.all([
    getDocumentForEditor(id),
    getAllUsers(),
  ]);

  if (!result.ok) {
    if (result.error === "Document not found") {
      notFound();
    }

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-3 px-4 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Unauthorized access</h1>
        <p className="text-sm text-slate-600">
          You do not have permission to view this document. Ask the owner to share it
          with you, or switch users from the header dropdown.
        </p>
        <Link
          href="/"
          className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Return to dashboard
        </Link>
      </div>
    );
  }

  return <DocumentEditor document={result.data} users={users} />;
}
