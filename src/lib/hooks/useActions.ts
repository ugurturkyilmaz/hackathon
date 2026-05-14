"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ActionStatus, ActionWithContext, User } from "@/types";

export function useActions() {
  const [actions, setActions] = useState<ActionWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const data = await api.get<ActionWithContext[]>("/api/actions");
      setActions(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const es = new EventSource("/api/actions/stream");
    es.addEventListener("message", () => {
      fetchAll();
    });
    return () => es.close();
  }, [fetchAll]);

  const addAction = async (input: {
    card_id: string | null;
    group_id: string | null;
    assigned_to: string | null;
    description: string;
    deadline: string | null;
  }) => {
    await api.post("/api/actions", input);
  };

  const updateStatus = async (id: string, status: ActionStatus) => {
    await api.patch(`/api/actions/${id}`, { status });
  };

  return { actions, loading, error, addAction, updateStatus };
}

export function useSessionMembers() {
  const [members, setMembers] = useState<Pick<User, "id" | "name" | "role">[]>([]);

  useEffect(() => {
    api
      .get<User[]>("/api/users")
      .then((data) => setMembers(data.map((u) => ({ id: u.id, name: u.name, role: u.role }))))
      .catch(() => setMembers([]));
  }, []);

  return members;
}
