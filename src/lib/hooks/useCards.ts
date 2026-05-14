"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Card, Category } from "@/types";

export function useCards(sessionId: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setCards([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    setLoading(true);
    supabase
      .from("cards")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setCards((data ?? []) as Card[]);
        setLoading(false);
      });

    channel = supabase
      .channel(`cards:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cards",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newCard = payload.new as Card;
          setCards((prev) => (prev.some((c) => c.id === newCard.id) ? prev : [...prev, newCard]));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cards",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as Card;
          setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "cards",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const oldId = (payload.old as { id: string }).id;
          setCards((prev) => prev.filter((c) => c.id !== oldId));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const addCard = async (text: string, category: Category, userId?: string | null) => {
    if (!sessionId) return;
    const { error } = await supabase.from("cards").insert({
      session_id: sessionId,
      text,
      category,
      user_id: userId ?? null,
    });
    if (error) throw error;
  };

  const voteCard = async (cardId: string) => {
    const { data, error: fetchErr } = await supabase
      .from("cards")
      .select("votes")
      .eq("id", cardId)
      .single();
    if (fetchErr || !data) return;
    const newVotes = (data.votes ?? 0) + 1;
    const { error } = await supabase.from("cards").update({ votes: newVotes }).eq("id", cardId);
    if (error) throw error;
  };

  return { cards, loading, error, addCard, voteCard };
}
