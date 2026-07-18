import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-start justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Document not found</h1>
      <p className="text-sm text-slate-600">
        This document does not exist or may have been deleted.
      </p>
      <Link
        href="/"
        className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
