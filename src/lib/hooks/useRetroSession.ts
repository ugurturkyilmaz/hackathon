"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { RetroSession, SessionStatus } from "@/types";

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
    let channel: RealtimeChannel | null = null;

    setLoading(true);
    supabase
      .from("retro_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setSession(data as RetroSession);
        setLoading(false);
      });

    channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "retro_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new as RetroSession);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const updateStatus = async (next: SessionStatus) => {
    if (!sessionId) return;
    const { error } = await supabase
      .from("retro_sessions")
      .update({ status: next })
      .eq("id", sessionId);
    if (error) throw error;
  };

  return { session, loading, error, updateStatus };
}
