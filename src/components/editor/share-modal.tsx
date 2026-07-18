"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  listDocumentShares,
  revokeShare,
  shareDocument,
} from "@/app/actions/shares";
import type { AccessLevel } from "@/lib/permissions";
import type { AuthUser } from "@/lib/constants";

type ShareRow = {
  id: string;
  accessLevel: string;
  user: AuthUser;
};

export function ShareModal({
  open,
  onClose,
  documentId,
  users,
  ownerId,
}: {
  open: boolean;
  onClose: () => void;
  documentId: string;
  users: AuthUser[];
  ownerId: string;
}) {
  if (!open) return null;

  return (
    <ShareModalContent
      onClose={onClose}
      documentId={documentId}
      users={users}
      ownerId={ownerId}
    />
  );
}

function ShareModalContent({
  onClose,
  documentId,
  users,
  ownerId,
}: {
  onClose: () => void;
  documentId: string;
  users: AuthUser[];
  ownerId: string;
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("view");
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const shareableUsers = users.filter((user) => user.id !== ownerId);

  useEffect(() => {
    let cancelled = false;

    listDocumentShares(documentId)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          toast.error(result.error);
          setShares([]);
          return;
        }
        setShares(result.data);
        const firstAvailable = shareableUsers.find(
          (user) => !result.data.some((share) => share.user.id === user.id),
        );
        setSelectedUserId(firstAvailable?.id ?? shareableUsers[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load shares");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // shareableUsers is derived from stable seeded users for this session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id="share-modal-title" className="text-base font-semibold text-slate-900">
            Share document
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close share dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <p className="text-sm text-slate-500">
            Grant access to another seeded user. Choose view or edit permission.
          </p>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">User</span>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                disabled={isPending || shareableUsers.length === 0}
              >
                {shareableUsers.length === 0 ? (
                  <option value="">No other users</option>
                ) : (
                  shareableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Access</span>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                value={accessLevel}
                onChange={(event) =>
                  setAccessLevel(event.target.value as AccessLevel)
                }
                disabled={isPending}
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            disabled={isPending || !selectedUserId}
            className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              startTransition(async () => {
                const result = await shareDocument({
                  documentId,
                  sharedWithUserId: selectedUserId,
                  accessLevel,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Access granted");
                const refreshed = await listDocumentShares(documentId);
                if (refreshed.ok) setShares(refreshed.data);
              });
            }}
          >
            {isPending ? "Sharing…" : "Grant access"}
          </button>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-800">
              People with access
            </h3>
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-slate-500">Not shared with anyone yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
                {shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{share.user.name}</p>
                      <p className="text-xs text-slate-500">
                        {share.user.email} · {share.accessLevel}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-rose-600 hover:text-rose-700"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await revokeShare({
                            documentId,
                            sharedWithUserId: share.user.id,
                          });
                          if (!result.ok) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Access revoked");
                          setShares((current) =>
                            current.filter((row) => row.id !== share.id),
                          );
                        });
                      }}
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
