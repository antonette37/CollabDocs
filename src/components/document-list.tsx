import Link from "next/link";
import { Clock3, Share2 } from "lucide-react";

export type DocumentListItem = {
  id: string;
  title: string;
  updatedAt: Date;
  ownerName?: string;
  accessLevel?: string;
  shared?: boolean;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function DocumentList({
  title,
  description,
  documents,
  emptyMessage,
  showOwner = false,
}: {
  title: string;
  description: string;
  documents: DocumentListItem[];
  emptyMessage: string;
  showOwner?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className="flex items-start justify-between gap-4 px-4 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-slate-900">
                      {doc.title || "Untitled Document"}
                    </p>
                    {doc.shared || showOwner ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                        Shared with me
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      Updated {formatDate(doc.updatedAt)}
                    </span>
                    {showOwner && doc.ownerName ? (
                      <span className="inline-flex items-center gap-1">
                        <Share2 className="h-3.5 w-3.5" aria-hidden />
                        Owned by {doc.ownerName}
                        {doc.accessLevel ? ` · ${doc.accessLevel}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-sm text-sky-700">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
