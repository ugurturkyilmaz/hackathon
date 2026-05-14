"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/utils/constants";
import type { RetroSession, Role, SessionStatus } from "@/types";

interface Props {
  session: RetroSession;
  userRole: Role;
  onUpdate: (next: SessionStatus) => Promise<void>;
}

const NEXT: Partial<Record<SessionStatus, { next: SessionStatus; label: string }>> = {
  writing: { next: "voting", label: "Oylamaya Geç" },
  voting: { next: "finished", label: "Bitir" },
};

export function PhaseControl({ session, userRole, onUpdate }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isController = userRole === "scrum_master" || userRole === "admin";
  const transition = NEXT[session.status];

  const click = async () => {
    if (!transition) return;
    if (!confirm(`"${transition.label}"? Bu işlem geri alınamaz.`)) return;
    setBusy(true);
    setError(null);
    try {
      await onUpdate(transition.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-indigo-900">{session.name}</h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[session.status]}`}
          >
            {STATUS_LABEL[session.status]}
          </span>
        </div>
        <p className="text-xs text-indigo-700 mt-1">
          Oy limiti: {session.vote_limit} · Aşama: {STATUS_LABEL[session.status]}
        </p>
      </div>

      {isController && transition && (
        <Button onClick={click} disabled={busy}>
          {busy ? "Güncelleniyor..." : `${transition.label} →`}
        </Button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
