import type { ActionStatus } from "@/types";

export interface DeadlineMeta {
  state: "overdue" | "due-soon" | "ok" | "none";
  daysLeft: number | null;
  label: string;
}

export function deadlineMeta(deadline: string | null, status: ActionStatus): DeadlineMeta {
  if (status === "done") return { state: "ok", daysLeft: null, label: "Tamamlandı" };
  if (!deadline) return { state: "none", daysLeft: null, label: "Süre yok" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { state: "overdue", daysLeft: diffDays, label: `${Math.abs(diffDays)} gün gecikti` };
  }
  if (diffDays === 0) return { state: "due-soon", daysLeft: 0, label: "Bugün son gün" };
  if (diffDays <= 3) return { state: "due-soon", daysLeft: diffDays, label: `Son ${diffDays} gün` };
  return { state: "ok", daysLeft: diffDays, label: `${diffDays} gün kaldı` };
}

export function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
