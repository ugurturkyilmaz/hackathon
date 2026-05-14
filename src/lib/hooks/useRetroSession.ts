"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RetroSession, SessionStatus } from "@/types";

interface SseSessionUpdate {
  type: "session:update";
  session: RetroSession;
}

export function useRetroSession(sessionId: string | null) {
  const [session, setSession] = useState<RetroSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let es: EventSource | null = null;

    setLoading(true);
    api
      .get<RetroSession>(`/api/sessions/${sessionId}`)
      .then((data) => {
        if (cancelled) return;
        setSession(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });

    es = new EventSource(`/api/sessions/${sessionId}/stream`);
    es.addEventListener("message", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data) as SseSessionUpdate | { type: string };
        if (payload.type === "session:update") {
          setSession((payload as SseSessionUpdate).session);
        }
      } catch {
        // ignore
      }
    });

    return () => {
      cancelled = true;
      es?.close();
    };
  }, [sessionId]);

  const updateStatus = async (next: SessionStatus) => {
    if (!sessionId) return;
    await api.patch(`/api/sessions/${sessionId}`, { status: next });
  };

  return { session, loading, error, updateStatus };
}
