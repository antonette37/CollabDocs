"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { importDocumentContent } from "@/app/actions/documents";

const ACCEPTED = ".txt,.md,text/plain,text/markdown";

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function ImportFileButton({
  documentId,
  variant = "primary",
}: {
  documentId?: string;
  variant?: "primary" | "secondary";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const className =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      : "inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        className={className}
        title="Import a .txt or .md file"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" aria-hidden />
        {isPending ? "Importing…" : "Import Document"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        aria-label="Import Document (.txt or .md)"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;

          const lower = file.name.toLowerCase();
          if (!lower.endsWith(".txt") && !lower.endsWith(".md")) {
            toast.error(
              "Unsupported file type. Only .txt and .md files are supported.",
            );
            return;
          }

          startTransition(async () => {
            try {
              const text = await readFileAsText(file);
              const result = await importDocumentContent(documentId ?? null, {
                filename: file.name,
                text,
              });

              if (!result.ok) {
                toast.error(result.error);
                return;
              }

              toast.success(`Imported ${file.name}`);
              if (!documentId || result.data.id !== documentId) {
                router.push(`/documents/${result.data.id}`);
              } else {
                router.refresh();
              }
            } catch (error) {
              console.error(error);
              toast.error("Failed to read the selected file");
            }
          });
        }}
      />
    </>
  );
}
