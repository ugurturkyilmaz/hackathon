"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { RoleGuard } from "@/components/RoleGuard";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { RetroSession, TeamWithMembers } from "@/types";

function NewRetroInner() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [name, setName] = useState("");
  const [voteLimit, setVoteLimit] = useState(3);
  const [writingMinutes, setWritingMinutes] = useState(5);
  const [teamId, setTeamId] = useState<string>("");
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<TeamWithMembers[]>("/api/teams")
      .then((data) => {
        setTeams(data);
        // SM ise kendi ekibini auto-select
        if (user?.role === "scrum_master") {
          const own = data.find((t) => t.scrum_master_id === user.id);
          if (own) setTeamId(own.id);
        } else if (data.length === 1) {
          setTeamId(data[0].id);
        }
      })
      .catch(() => setTeams([]))
      .finally(() => setLoadingTeams(false));
  }, [user]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Oturum adı boş olamaz");
    if (!teamId) return setError("Ekip seçmelisin");
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<RetroSession>("/api/sessions", {
        name: trimmed,
        vote_limit: voteLimit,
        writing_minutes: writingMinutes,
        team_id: teamId,
        created_by: user?.id ?? null,
      });
      router.replace(`/retro/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      setSubmitting(false);
    }
  };

  // SM yalnızca kendi ekibini görsün
  const visibleTeams =
    user?.role === "admin"
      ? teams
      : teams.filter((t) => t.scrum_master_id === user?.id);

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Ekip</label>
          <Select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            disabled={loadingTeams}
          >
            <option value="">— Ekip seç —</option>
            {visibleTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.members.length} üye)
              </option>
            ))}
          </Select>
          {!loadingTeams && visibleTeams.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded mt-2 p-2">
              {user?.role === "admin"
                ? "Henüz ekip yok. Admin → Ekipler sayfasından oluştur."
                : "Sana atanmış bir ekip yok. Admin'den ekibe atanmanı iste."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yazma süresi (dk)
            </label>
            <Input
              type="number"
              min={1}
              max={30}
              value={writingMinutes}
              onChange={(e) =>
                setWritingMinutes(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oy limiti</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={voteLimit}
              onChange={(e) =>
                setVoteLimit(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
              }
            />
          </div>
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
