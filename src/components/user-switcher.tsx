"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRound } from "lucide-react";
import { switchUser } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/constants";

const USER_ROLE_LABELS: Record<string, string> = {
  "user-antonette": "Antonette (Owner)",
  "user-bob": "Bob (Colleague)",
  "user-charlie": "Charlie (Colleague)",
};

function formatUserLabel(user: AuthUser): string {
  return USER_ROLE_LABELS[user.id] ?? `${user.name} (Colleague)`;
}

export function UserSwitcher({
  users,
  currentUser,
}: {
  users: AuthUser[];
  currentUser: AuthUser;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <UserRound className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <span className="hidden sm:inline">Logged-in user</span>
      <select
        className="max-w-[16rem] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-60"
        value={currentUser.id}
        disabled={isPending}
        aria-label="Switch current logged-in user"
        onChange={(event) => {
          const userId = event.target.value;
          startTransition(async () => {
            const result = await switchUser(userId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            const selected = users.find((user) => user.id === userId);
            toast.success(
              selected
                ? `Switched to ${formatUserLabel(selected)}`
                : "Switched user",
            );
            router.refresh();
          });
        }}
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {formatUserLabel(user)}
          </option>
        ))}
      </select>
    </label>
  );
}
