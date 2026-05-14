"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { deadlineMeta } from "@/lib/utils/deadline";
import { CATEGORY_META } from "@/lib/utils/constants";
import type { ActionWithContext } from "@/types";

interface Response {
  previousSession: { id: string; name: string; created_at: string } | null;
  actions: ActionWithContext[];
}

interface Props {
  sessionId: string;
}

export function PreviousActionsPanel({ sessionId }: Props) {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api
      .get<Response>(`/api/sessions/${sessionId}/previous-actions`)
      .then(setData)
      .catch(() => setData({ previousSession: null, actions: [] }))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <Spinner size={16} />
        <span className="text-sm text-amber-800">Önceki retro aksiyonları yükleniyor...</span>
      </div>
    );
  }

  if (!data?.previousSession || data.actions.length === 0) return null;

  const open = data.actions.filter((a) => a.status === "open");
  const done = data.actions.filter((a) => a.status === "done");

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-amber-900 flex items-center gap-2">
            📋 Önceki Retro: {data.previousSession.name}
          </h3>
          <p className="text-xs text-amber-800 mt-0.5">
            {new Date(data.previousSession.created_at).toLocaleDateString("tr-TR")} ·{" "}
            {open.length} açık · {done.length} tamamlanmış aksiyon
          </p>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-xs text-amber-700 hover:text-amber-900 underline"
        >
          {collapsed ? "Göster" : "Gizle"}
        </button>
      </div>

      {!collapsed && (
        <ul className="space-y-1.5">
          {data.actions.map((a) => {
            const meta = deadlineMeta(a.deadline, a.status);
            const cat = a.card?.category;
            const catMeta = cat ? CATEGORY_META[cat] : null;
            return (
              <li
                key={a.id}
                className="bg-white border border-amber-200 rounded-lg p-2.5 text-sm flex items-start gap-2 flex-wrap"
              >
                {a.group ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    📦 {a.group.name}
                  </span>
                ) : catMeta ? (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${catMeta.chip}`}>
                    {cat}
                  </span>
                ) : null}
                <span className="flex-1 min-w-0">
                  <span className="text-gray-900">{a.description}</span>
                  {a.assignee && (
                    <span className="text-gray-500 text-xs"> · {a.assignee.name}</span>
                  )}
                </span>
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    a.status === "done"
                      ? "bg-green-100 text-green-700"
                      : meta.state === "overdue"
                        ? "bg-red-100 text-red-700"
                        : meta.state === "due-soon"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {a.status === "done" ? "✓ Tamam" : meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
