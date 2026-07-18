"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CloudOff,
  LoaderCircle,
  Lock,
  Share2,
} from "lucide-react";
import { updateDocument } from "@/app/actions/documents";
import { EditorToolbar } from "@/components/editor/toolbar";
import { ShareModal } from "@/components/editor/share-modal";
import { ImportFileButton } from "@/components/import-file-button";
import type { DocumentAccess } from "@/lib/permissions";
import type { AuthUser } from "@/lib/constants";

type EditorDocument = {
  id: string;
  title: string;
  content: string;
  owner: AuthUser;
  access: DocumentAccess;
  currentUser: AuthUser;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function DocumentEditor({
  document: initialDocument,
  users,
}: {
  document: EditorDocument;
  users: AuthUser[];
}) {
  const canEdit = initialDocument.access.canEdit;
  const isOwner = initialDocument.access.role === "owner";
  const [title, setTitle] = useState(initialDocument.title);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const titleRef = useRef(title);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef({
    title: initialDocument.title,
    content: initialDocument.content,
  });

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: canEdit
          ? "Start writing…"
          : "You have view-only access to this document.",
      }),
    ],
    [canEdit],
  );

  const persist = useCallback(
    async (next: { title?: string; content?: string }) => {
      if (!canEdit) return;

      const payload = {
        title: next.title ?? titleRef.current,
        content: next.content,
      };

      const titleChanged =
        payload.title !== undefined && payload.title !== lastSaved.current.title;
      const contentChanged =
        payload.content !== undefined &&
        payload.content !== lastSaved.current.content;

      if (!titleChanged && !contentChanged) {
        return;
      }

      setSaveState("saving");
      toast.loading("Saving...", { id: "doc-autosave" });

      try {
        const result = await updateDocument(initialDocument.id, {
          ...(titleChanged ? { title: payload.title } : {}),
          ...(contentChanged ? { content: payload.content } : {}),
        });

        if (!result.ok) {
          setSaveState("error");
          toast.error(result.error, { id: "doc-autosave" });
          return;
        }

        if (titleChanged && payload.title !== undefined) {
          lastSaved.current.title = payload.title;
        }
        if (contentChanged && payload.content !== undefined) {
          lastSaved.current.content = payload.content;
        }
        setSaveState("saved");
        toast.dismiss("doc-autosave");
      } catch {
        setSaveState("error");
        toast.error("Failed to auto-save", { id: "doc-autosave" });
      }
    },
    [canEdit, initialDocument.id],
  );

  const scheduleSave = useCallback(
    (next: { title?: string; content?: string }) => {
      if (!canEdit) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Debounce auto-save within the 1.5–2s assessment window
      saveTimer.current = setTimeout(() => {
        void persist(next);
      }, 1750);
    },
    [canEdit, persist],
  );

  const editor = useEditor({
    extensions,
    content: initialDocument.content,
    editable: canEdit,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[28rem] px-4 py-5 focus:outline-none sm:px-6",
      },
    },
    onUpdate: ({ editor: current }) => {
      scheduleSave({ content: current.getHTML() });
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

  const ownershipLabel =
    initialDocument.access.role === "owner"
      ? "You own this document"
      : `Owned by ${initialDocument.owner.name}`;

  const permissionLabel =
    initialDocument.access.role === "owner"
      ? "Owner · full access"
      : initialDocument.access.role === "shared"
        ? `Shared with you · ${initialDocument.access.accessLevel}`
        : "No access";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to dashboard
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <SaveIndicator state={saveState} />
          {canEdit ? (
            <ImportFileButton documentId={initialDocument.id} variant="secondary" />
          ) : null}
          {isOwner ? (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Share
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
          {ownershipLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">
          {!canEdit ? <Lock className="h-3.5 w-3.5" aria-hidden /> : null}
          {permissionLabel}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <input
          value={title}
          readOnly={!canEdit}
          onChange={(event) => {
            const nextTitle = event.target.value;
            setTitle(nextTitle);
            scheduleSave({ title: nextTitle });
          }}
          onBlur={() => {
            if (!canEdit) return;
            if (saveTimer.current) clearTimeout(saveTimer.current);
            void persist({ title });
          }}
          className="w-full border-b border-slate-200 px-4 py-3 text-2xl font-semibold text-slate-900 outline-none placeholder:text-slate-400 read-only:bg-slate-50 sm:px-6"
          placeholder="Document title"
          aria-label="Document title"
        />
        <EditorToolbar editor={editor} readOnly={!canEdit} />
        <EditorContent editor={editor} />
      </div>

      <p className="text-xs text-slate-500">
        Supported imports: <code className="rounded bg-slate-100 px-1">.txt</code> and{" "}
        <code className="rounded bg-slate-100 px-1">.md</code> files. Changes auto-save
        while you type{canEdit ? "" : " (disabled in view-only mode)"}.
      </p>

      {isOwner ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          documentId={initialDocument.id}
          users={users}
          ownerId={initialDocument.owner.id}
        />
      ) : null}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }

  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
        <Check className="h-3.5 w-3.5" aria-hidden />
        All changes saved
      </span>
    );
  }

  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-rose-600">
        <CloudOff className="h-3.5 w-3.5" aria-hidden />
        Save failed
      </span>
    );
  }

  return <span className="text-sm text-transparent select-none">idle</span>;
}
