"use client";

import { useEffect, useState } from "react";

export function useVoting(sessionId: string | null, voteLimit: number) {
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!sessionId) return;
    try {
      const stored = localStorage.getItem(`votes:${sessionId}`);
      if (stored) setMyVotes(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, [sessionId]);

  const totalVotesUsed = Object.values(myVotes).reduce((sum, n) => sum + n, 0);
  const remainingVotes = Math.max(0, voteLimit - totalVotesUsed);
  const canVote = remainingVotes > 0;

  const recordVote = (cardId: string) => {
    if (!sessionId) return;
    const updated = { ...myVotes, [cardId]: (myVotes[cardId] ?? 0) + 1 };
    setMyVotes(updated);
    localStorage.setItem(`votes:${sessionId}`, JSON.stringify(updated));
  };

  const reset = () => {
    if (!sessionId) return;
    localStorage.removeItem(`votes:${sessionId}`);
    setMyVotes({});
  };

  return { myVotes, totalVotesUsed, remainingVotes, canVote, recordVote, reset };
}
