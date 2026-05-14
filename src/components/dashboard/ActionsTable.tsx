"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Select } from "@/components/ui/Input";
import { CATEGORY_META } from "@/lib/utils/constants";
import type { ActionStatus, ActionWithContext } from "@/types";

interface Props {
  actions: ActionWithContext[];
  canMarkDone?: boolean;
  onMarkDone?: (id: string, status: ActionStatus) => Promise<void>;
}

type Filter = "all" | "open" | "done";

function deadlineColor(deadline: string | null, status: ActionStatus): string {
  if (status === "done") return "text-gray-500 line-through";
  if (!deadline) return "text-gray-500";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "text-red-600 font-semibold";
  if (diffDays <= 3) return "text-amber-600 font-semibold";
  return "text-green-700";
}

export function ActionsTable({ actions, canMarkDone, onMarkDone }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return actions;
    return actions.filter((a) => a.status === filter);
  }, [actions, filter]);

  if (actions.length === 0) {
    return (
      <Empty
        icon="✅"
        title="Henüz aksiyon yok"
        description="Retro oturumlarındaki kartlardan aksiyon oluşturulduğunda burada listelenecek."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {filtered.length} / {actions.length} aksiyon
        </p>
        <div className="w-40">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="all">Tümü</option>
            <option value="open">Açık</option>
            <option value="done">Tamamlanan</option>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Kart</th>
                <th className="px-4 py-3 text-left">Aksiyon</th>
                <th className="px-4 py-3 text-left">Sorumlu</th>
                <th className="px-4 py-3 text-left">Deadline</th>
                <th className="px-4 py-3 text-left">Retro</th>
                <th className="px-4 py-3 text-left">Durum</th>
                {canMarkDone && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => {
                const cat = a.card?.category;
                const meta = cat ? CATEGORY_META[cat] : null;
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {meta && (
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mr-1 ${meta.chip}`}>
                          {cat}
                        </span>
                      )}
                      <span className="text-gray-900">{a.card?.text ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{a.description}</td>
                    <td className="px-4 py-3 text-gray-700">{a.assignee?.name ?? "—"}</td>
                    <td className={`px-4 py-3 ${deadlineColor(a.deadline, a.status)}`}>
                      {a.deadline ? new Date(a.deadline).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{a.session?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.status === "done"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {a.status === "done" ? "Tamam" : "Açık"}
                      </span>
                    </td>
                    {canMarkDone && (
                      <td className="px-4 py-3 text-right">
                        {a.status === "open" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onMarkDone?.(a.id, "done")}
                          >
                            ✓ Bitti
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkDone?.(a.id, "open")}
                          >
                            Geri al
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
