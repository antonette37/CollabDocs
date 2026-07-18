"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
        <div className="mx-auto max-w-lg space-y-4">
          <h1 className="text-2xl font-semibold">Application error</h1>
          <p className="text-sm text-slate-600">
            {error.message || "A critical error stopped the page from rendering."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
