"use client";

import { useEffect, useState } from "react";

interface Props {
  endsAt: string | null;
  /** Show even when 0 (with "Süre doldu" label) */
  visible: boolean;
}

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Timer({ endsAt, visible }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt || !visible) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt, visible]);

  if (!visible || !endsAt) return null;

  const remaining = new Date(endsAt).getTime() - now;
  const expired = remaining <= 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-semibold ${
        expired
          ? "bg-red-100 text-red-700 border border-red-200"
          : remaining < 30_000
            ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
            : "bg-indigo-100 text-indigo-700 border border-indigo-200"
      }`}
      aria-label="Yazma süresi"
    >
      <span aria-hidden>⏱</span>
      {expired ? "Süre doldu" : format(remaining)}
    </div>
  );
}
