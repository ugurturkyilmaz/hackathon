"use client";

import Link from "next/link";
import { useState } from "react";
import { useTeams, useUsers } from "@/lib/hooks/useTeams";
import { RoleGuard } from "@/components/RoleGuard";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Empty } from "@/components/ui/Empty";
import { ROLE_LABEL } from "@/lib/utils/constants";
import type { TeamWithMembers, User } from "@/types";

function AdminTeamsInner() {
  const { teams, loading, error, refresh, createTeam, updateTeam, deleteTeam, addMember, removeMember } =
    useTeams();
  const { users } = useUsers();

  const scrumMasters = users.filter((u) => u.role === "scrum_master" || u.role === "admin");

  const [newTeamName, setNewTeamName] = useState("");
  const [newSm, setNewSm] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onCreate = async () => {
    if (!newTeamName.trim()) {
      setErrorMsg("Ekip adı boş olamaz");
      return;
    }
    setCreating(true);
    setErrorMsg(null);
    try {
      await createTeam({ name: newTeamName.trim(), scrum_master_id: newSm || null });
      setNewTeamName("");
      setNewSm("");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Hata");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin · Ekipler</h1>
          <p className="text-sm text-gray-500">Ekip oluştur, Scrum Master ata, üye seç.</p>
        </div>
        <Link href="/admin">
          <Button variant="secondary">← Kullanıcılar</Button>
        </Link>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Yeni Ekip</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Ekip adı (ör: Falcon Team)"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <Select value={newSm} onChange={(e) => setNewSm(e.target.value)}>
            <option value="">— Scrum Master seç —</option>
            {scrumMasters.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABEL[u.role]})
              </option>
            ))}
          </Select>
          <Button onClick={onCreate} disabled={creating}>
            {creating ? "Oluşturuluyor..." : "+ Ekip Oluştur"}
          </Button>
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        {scrumMasters.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Henüz Scrum Master rolünde kullanıcı yok. Önce kullanıcıların rolünü değiştir.
          </p>
        )}
      </section>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size={32} />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
      )}

      {!loading && !error && teams.length === 0 && (
        <Empty icon="👥" title="Henüz ekip yok" description="Yukarıdan ilk ekibi oluştur." />
      )}

      {!loading && teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              users={users}
              scrumMasters={scrumMasters}
              onUpdateSm={(smId) => updateTeam(t.id, { scrum_master_id: smId })}
              onAddMember={(uid) => addMember(t.id, uid)}
              onRemoveMember={(uid) => removeMember(t.id, uid)}
              onDelete={async () => {
                if (confirm(`"${t.name}" ekibini silmek istediğine emin misin?`)) {
                  await deleteTeam(t.id);
                }
              }}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TeamCardProps {
  team: TeamWithMembers;
  users: User[];
  scrumMasters: User[];
  onUpdateSm: (smId: string | null) => Promise<void>;
  onAddMember: (uid: string) => Promise<void>;
  onRemoveMember: (uid: string) => Promise<void>;
  onDelete: () => void | Promise<void>;
  onRefresh: () => void;
}

function TeamCard({
  team,
  users,
  scrumMasters,
  onUpdateSm,
  onAddMember,
  onRemoveMember,
  onDelete,
}: TeamCardProps) {
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);

  const memberIds = new Set(team.members.map((m) => m.id));
  const candidates = users.filter(
    (u) => !memberIds.has(u.id) && u.role !== "admin" && u.role !== "manager",
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
          <p className="text-xs text-gray-500">{team.members.length} üye</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          🗑
        </Button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
          Scrum Master
        </label>
        <Select
          value={team.scrum_master_id ?? ""}
          onChange={async (e) => {
            setBusy(true);
            await onUpdateSm(e.target.value || null);
            setBusy(false);
          }}
          disabled={busy}
        >
          <option value="">— Yok —</option>
          {scrumMasters.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
          Üyeler
        </label>
        {team.members.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Henüz üye yok</p>
        ) : (
          <ul className="space-y-1">
            {team.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span>
                  {m.name}{" "}
                  <span className="text-xs text-gray-500">({ROLE_LABEL[m.role]})</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => onRemoveMember(m.id)}>
                  ✕
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {candidates.length > 0 && (
        <div className="flex gap-2">
          <Select value={adding} onChange={(e) => setAdding(e.target.value)} className="flex-1">
            <option value="">— Üye ekle —</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABEL[u.role]})
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            disabled={!adding}
            onClick={async () => {
              if (!adding) return;
              await onAddMember(adding);
              setAdding("");
            }}
          >
            Ekle
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminTeamsPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <Header />
      <AdminTeamsInner />
    </RoleGuard>
  );
}
