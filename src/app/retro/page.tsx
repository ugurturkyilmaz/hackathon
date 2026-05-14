"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { RoleGuard } from "@/components/RoleGuard";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Empty } from "@/components/ui/Empty";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/utils/constants";
import type { RetroSession } from "@/types";

function RetroListInner() {
  const { user } = useCurrentUser();
  const [sessions, setSessions] = useState<RetroSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<RetroSession[]>("/api/sessions")
      .then((data) => {
        setSessions(data);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const isSm = user?.role === "scrum_master" || user?.role === "admin";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Retro Oturumları</h1>
          <p className="text-sm text-gray-500">Aktif ve tamamlanmış retrospektifler.</p>
        </div>
        {isSm && (
          <Link href="/retro/new">
            <Button>+ Yeni Retro</Button>
          </Link>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size={32} />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <Empty
          icon="🗂️"
          title="Henüz retro oturumu yok"
          description={
            isSm
              ? "İlk oturumu oluşturarak başla."
              : "Bir Scrum Master oturum açtığında burada görünecek."
          }
          action={
            isSm && (
              <Link href="/retro/new">
                <Button>+ Yeni Retro Oluştur</Button>
              </Link>
            )
          }
        />
      )}

      {!loading && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/retro/${s.id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[s.status]}`}
                >
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Oy limiti: {s.vote_limit} ·{" "}
                {new Date(s.created_at).toLocaleDateString("tr-TR")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RetroListPage() {
  return (
    <RoleGuard allow={["scrum_master", "member", "admin"]}>
      <Header />
      <RetroListInner />
    </RoleGuard>
  );
}
