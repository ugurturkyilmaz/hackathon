"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useActions } from "@/lib/hooks/useActions";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deadlineMeta } from "@/lib/utils/deadline";
import type { ActionWithContext } from "@/types";

const DISMISS_KEY = "retroflow_alerts_dismissed_at";
const DISMISS_TTL_MS = 6 * 60 * 60 * 1000; // 6 saat

export function ActionAlerts() {
  const { user } = useCurrentUser();
  const { actions } = useActions();
  const [open, setOpen] = useState(false);

  // Filter by audience: members/SM see only their own assigned; managers/admins see all
  const relevant = useMemo(() => {
    if (!user) return [];
    const isManagerLike = user.role === "manager" || user.role === "admin";
    const filtered = isManagerLike
      ? actions
      : actions.filter((a) => a.assigned_to === user.id);
    return filtered.filter((a) => {
      if (a.status !== "open") return false;
      const meta = deadlineMeta(a.deadline, a.status);
      return meta.state === "overdue" || meta.state === "due-soon";
    });
  }, [actions, user]);

  useEffect(() => {
    if (!user || relevant.length === 0) return;
    if (typeof window === "undefined") return;
    const last = sessionStorage.getItem(DISMISS_KEY);
    if (last && Date.now() - Number(last) < DISMISS_TTL_MS) return;
    setOpen(true);
  }, [user, relevant.length]);

  const close = () => {
    setOpen(false);
    sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!user || relevant.length === 0) return null;

  const overdue = relevant.filter((a) => deadlineMeta(a.deadline, a.status).state === "overdue");
  const dueSoon = relevant.filter((a) => deadlineMeta(a.deadline, a.status).state === "due-soon");

  return (
    <>
      {/* Header chip - always visible if there are alerts */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
        aria-label="Aksiyon uyarıları"
      >
        🔔 {overdue.length > 0 && <span>{overdue.length} gecikmiş</span>}
        {overdue.length > 0 && dueSoon.length > 0 && <span>·</span>}
        {dueSoon.length > 0 && <span>{dueSoon.length} yakın</span>}
      </button>

      <Modal open={open} onClose={close} title="🔔 Aksiyon Uyarıları">
        <p className="text-sm text-gray-600 mb-4">
          {user.role === "manager" || user.role === "admin"
            ? "Tüm açık aksiyonlar arasında deadline'ı geçmiş veya yaklaşan kayıtlar."
            : "Sana atanmış, deadline'ı geçmiş veya yaklaşan aksiyonlar."}
        </p>

        {overdue.length > 0 && (
          <Section
            title={`Süresi Doldu (${overdue.length})`}
            color="red"
            actions={overdue}
          />
        )}

        {dueSoon.length > 0 && (
          <Section
            title={`Yaklaşan (${dueSoon.length})`}
            color="amber"
            actions={dueSoon}
          />
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Link href="/dashboard">
            <Button variant="secondary" onClick={close}>
              Dashboard'a git
            </Button>
          </Link>
          <Button onClick={close}>Anladım</Button>
        </div>
      </Modal>
    </>
  );
}

function Section({
  title,
  color,
  actions,
}: {
  title: string;
  color: "red" | "amber";
  actions: ActionWithContext[];
}) {
  const wrap =
    color === "red"
      ? "bg-red-50 border-red-200"
      : "bg-amber-50 border-amber-200";
  const textC = color === "red" ? "text-red-700" : "text-amber-800";
  return (
    <div className={`mb-3 rounded-lg border ${wrap} p-3 space-y-2`}>
      <h4 className={`text-sm font-semibold ${textC}`}>{title}</h4>
      <ul className="space-y-1.5">
        {actions.map((a) => {
          const meta = deadlineMeta(a.deadline, a.status);
          return (
            <li key={a.id} className="text-sm flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-gray-900 truncate">{a.description}</div>
                <div className="text-xs text-gray-600">
                  {a.session?.name && <>Retro: {a.session.name} · </>}
                  {a.assignee?.name && <>Sorumlu: {a.assignee.name}</>}
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${textC} bg-white border`}>
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
