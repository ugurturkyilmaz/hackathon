"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { RoleGuard } from "@/components/RoleGuard";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { RetroSession } from "@/types";

function NewRetroInner() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [name, setName] = useState("");
  const [voteLimit, setVoteLimit] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Oturum adı boş olamaz");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<RetroSession>("/api/sessions", {
        name: trimmed,
        vote_limit: voteLimit,
        created_by: user?.id ?? null,
      });
      router.replace(`/retro/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Yeni Retro Oturumu</h1>
          <p className="text-sm text-gray-500">Ekibin için bir retrospektif aç.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Oturum adı</label>
          <Input
            placeholder="Ör: Sprint 12 Retro"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kişi başı oy limiti
          </label>
          <Input
            type="number"
            min={1}
            max={10}
            value={voteLimit}
            onChange={(e) => setVoteLimit(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={() => router.back()} className="flex-1">
            İptal
          </Button>
          <Button onClick={submit} disabled={submitting} className="flex-1">
            {submitting ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewRetroPage() {
  return (
    <RoleGuard allow={["scrum_master", "admin"]}>
      <Header />
      <NewRetroInner />
    </RoleGuard>
  );
}
