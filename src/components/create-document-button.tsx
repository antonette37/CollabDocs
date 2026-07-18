"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createDocument } from "@/app/actions/documents";

export function CreateDocumentButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => {
        startTransition(async () => {
          const result = await createDocument();
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Document created");
          router.push(`/documents/${result.data.id}`);
        });
      }}
    >
      <Plus className="h-4 w-4" aria-hidden />
      {isPending ? "Creating…" : "Create New Document"}
    </button>
  );
}
