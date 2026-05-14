"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CardGroup } from "@/types";

export function useGroups(sessionId: string | null) {
  const [groups, setGroups] = useState<CardGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setGroups([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<CardGroup[]>(`/api/sessions/${sessionId}/groups`);
      setGroups(data);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
    if (!sessionId) return;
    const es = new EventSource(`/api/sessions/${sessionId}/stream`);
    es.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as { type?: string };
        if (data.type === "group:insert" || data.type === "group:delete") {
          refresh();
        }
      } catch {
        // ignore
      }
    });
    return () => es.close();
  }, [sessionId, refresh]);

  const createGroup = async (name: string, cardIds: string[]) => {
    if (!sessionId) return;
    await api.post(`/api/sessions/${sessionId}/groups`, { name, card_ids: cardIds });
  };

  const deleteGroup = async (id: string) => {
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
  };

  return { groups, loading, createGroup, deleteGroup, refresh };
}
