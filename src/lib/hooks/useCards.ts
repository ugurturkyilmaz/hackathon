"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Card, Category } from "@/types";

interface CardInsert {
  type: "card:insert";
  card: Card;
}
interface CardUpdate {
  type: "card:update";
  card: Card;
}

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
    let es: EventSource | null = null;

    setLoading(true);
    api
      .get<Card[]>(`/api/sessions/${sessionId}/cards`)
      .then((data) => {
        if (cancelled) return;
        setCards(data);
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
        const payload = JSON.parse((ev as MessageEvent).data) as
          | CardInsert
          | CardUpdate
          | { type: string };
        if (payload.type === "card:insert") {
          const incoming = (payload as CardInsert).card;
          setCards((prev) => (prev.some((c) => c.id === incoming.id) ? prev : [...prev, incoming]));
        } else if (payload.type === "card:update") {
          const incoming = (payload as CardUpdate).card;
          setCards((prev) => prev.map((c) => (c.id === incoming.id ? incoming : c)));
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

  const addCard = async (text: string, category: Category, userId?: string | null) => {
    if (!sessionId) return;
    await api.post(`/api/sessions/${sessionId}/cards`, {
      text,
      category,
      user_id: userId ?? null,
    });
  };

  const voteCard = async (cardId: string) => {
    await api.post(`/api/cards/${cardId}/vote`, {});
  };

  return { cards, loading, error, addCard, voteCard };
}
