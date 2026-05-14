"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Action, ActionStatus, ActionWithContext } from "@/types";

export function useActions() {
  const [actions, setActions] = useState<ActionWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    const fetchAll = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("actions")
        .select(
          "*, card:cards(text, category, session_id), assignee:users!actions_assigned_to_fkey(name)",
        )
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else {
        const enriched = (data ?? []) as ActionWithContext[];
        const sessionIds = Array.from(
          new Set(enriched.map((a) => a.card?.session_id).filter(Boolean) as string[]),
        );
        if (sessionIds.length) {
          const { data: sessions } = await supabase
            .from("retro_sessions")
            .select("id, name")
            .in("id", sessionIds);
          const map = new Map((sessions ?? []).map((s) => [s.id as string, s.name as string]));
          enriched.forEach((a) => {
            const sid = a.card?.session_id;
            if (sid) a.session = { name: map.get(sid) ?? "" };
          });
        }
        setActions(enriched);
      }
      setLoading(false);
    };

    fetchAll();

    channel = supabase
      .channel("actions-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "actions" }, () => fetchAll())
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const addAction = async (input: {
    card_id: string;
    assigned_to: string | null;
    description: string;
    deadline: string | null;
  }) => {
    const { error } = await supabase.from("actions").insert(input);
    if (error) throw error;
  };

  const updateStatus = async (id: string, status: ActionStatus) => {
    const { error } = await supabase.from("actions").update({ status }).eq("id", id);
    if (error) throw error;
  };

  return { actions, loading, error, addAction, updateStatus };
}

export function useSessionMembers() {
  const [members, setMembers] = useState<Array<{ id: string; name: string; role: string }>>([]);

  useEffect(() => {
    supabase
      .from("users")
      .select("id, name, role")
      .order("name")
      .then(({ data }) => {
        setMembers((data ?? []) as Array<{ id: string; name: string; role: string }>);
      });
  }, []);

  return members;
}
