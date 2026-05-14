"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { TeamWithMembers, User } from "@/types";

export function useTeams() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<TeamWithMembers[]>("/api/teams");
      setTeams(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTeam = async (input: { name: string; scrum_master_id: string | null }) => {
    await api.post("/api/teams", input);
    await refresh();
  };

  const updateTeam = async (
    id: string,
    patch: Partial<{ name: string; scrum_master_id: string | null }>,
  ) => {
    await api.patch(`/api/teams/${id}`, patch);
    await refresh();
  };

  const deleteTeam = async (id: string) => {
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
    await refresh();
  };

  const addMember = async (teamId: string, userId: string) => {
    await api.post(`/api/teams/${teamId}/members`, { user_id: userId });
    await refresh();
  };

  const removeMember = async (teamId: string, userId: string) => {
    await fetch(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
    await refresh();
  };

  return {
    teams,
    loading,
    error,
    refresh,
    createTeam,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
  };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await api.get<User[]>("/api/users");
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, loading, refresh };
}
