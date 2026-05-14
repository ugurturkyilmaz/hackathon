"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { ROLE_LABEL } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";
import { ActionAlerts } from "@/components/ActionAlerts";

export function Header() {
  const { user, signOut } = useCurrentUser();
  const router = useRouter();

  if (!user) return null;

  const onLogout = () => {
    signOut();
    router.replace("/");
  };

  const home =
    user.role === "admin"
      ? "/admin"
      : user.role === "manager"
        ? "/dashboard"
        : "/retro";

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href={home} className="flex items-center gap-2 font-bold text-gray-900">
          <span className="text-xl">🔄</span>
          <span>Retroflow</span>
        </Link>
        <div className="flex items-center gap-3">
          <ActionAlerts />
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{ROLE_LABEL[user.role]}</div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
            {ROLE_LABEL[user.role]}
          </span>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  );
}
