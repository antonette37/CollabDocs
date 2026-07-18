import Link from "next/link";
import { FileText } from "lucide-react";
import { UserSwitcher } from "@/components/user-switcher";
import type { AuthUser } from "@/lib/constants";

export function Header({
  users,
  currentUser,
}: {
  users: AuthUser[];
  currentUser: AuthUser;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold tracking-tight text-slate-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <span className="leading-tight">
            CollabDocs
            <span className="ml-1.5 hidden text-xs font-normal text-slate-500 sm:inline">
              by Ma. Antonette Cabang
            </span>
          </span>
        </Link>
        <UserSwitcher users={users} currentUser={currentUser} />
      </div>
    </header>
  );
}
