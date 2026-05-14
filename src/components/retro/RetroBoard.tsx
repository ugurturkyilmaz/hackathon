"use client";

import { useState } from "react";
import { CardColumn } from "./CardColumn";
import { ActionForm } from "./ActionForm";
import { useCards } from "@/lib/hooks/useCards";
import { useVoting } from "@/lib/hooks/useVoting";
import { Spinner } from "@/components/ui/Spinner";
import { Empty } from "@/components/ui/Empty";
import type { Card, Category, RetroSession, Role } from "@/types";

interface Props {
  session: RetroSession;
  currentUser: { id: string; role: Role };
}

export function RetroBoard({ session, currentUser }: Props) {
  const { cards, loading, error, addCard, voteCard } = useCards(session.id);
  const { myVotes, remainingVotes, canVote, recordVote } = useVoting(
    session.id,
    session.vote_limit,
  );
  const [actionModalCard, setActionModalCard] = useState<Card | null>(null);

  const canCreateAction = currentUser.role === "scrum_master" || currentUser.role === "admin";
  const canWriteOrVote = currentUser.role === "scrum_master" || currentUser.role === "member";

  const onAdd = async (text: string, category: Category) => {
    await addCard(text, category, currentUser.id);
  };

  const onVote = async (cardId: string) => {
    if (!canVote || !canWriteOrVote) return;
    await voteCard(cardId);
    recordVote(cardId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        Hata: {error}
      </div>
    );
  }

  const cats: Category[] = ["mad", "glad", "sad"];

  return (
    <div className="space-y-4">
      {session.status === "voting" && canWriteOrVote && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm flex items-center justify-between">
          <span>
            Oylama açık. Kalan oyun: <strong>{remainingVotes}</strong> / {session.vote_limit}
          </span>
        </div>
      )}

      {session.status === "voting" && !canWriteOrVote && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
          Oylama aşaması — sadece SM ve ekip üyeleri oy verebilir.
        </div>
      )}

      {session.status === "finished" && (
        <div className="bg-gray-100 border border-gray-200 text-gray-700 rounded-lg p-3 text-sm">
          Bu retro tamamlandı. Aksiyonlar dashboard'da görünüyor.
        </div>
      )}

      {cards.length === 0 && session.status !== "writing" ? (
        <Empty
          icon="🗒️"
          title="Bu retroda kart yok"
          description="Yazma aşamasında üyeler kart eklemediği için board boş."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cats.map((cat) => (
            <CardColumn
              key={cat}
              category={cat}
              cards={cards.filter((c) => c.category === cat)}
              status={session.status}
              canVote={canVote && canWriteOrVote}
              myVotes={myVotes}
              canCreateAction={canCreateAction}
              onAdd={onAdd}
              onVote={onVote}
              onCreateAction={(card) => setActionModalCard(card)}
            />
          ))}
        </div>
      )}

      {actionModalCard && (
        <ActionForm
          card={actionModalCard}
          onClose={() => setActionModalCard(null)}
        />
      )}
    </div>
  );
}
