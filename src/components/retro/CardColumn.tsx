"use client";

import { CATEGORY_META } from "@/lib/utils/constants";
import { RetroCard } from "./RetroCard";
import { AddCardInput } from "./AddCardInput";
import type { Card, Category, SessionStatus } from "@/types";

interface Props {
  category: Category;
  cards: Card[];
  status: SessionStatus;
  canVote: boolean;
  myVotes: Record<string, number>;
  canCreateAction: boolean;
  onAdd: (text: string, category: Category) => Promise<void>;
  onVote: (cardId: string) => void;
  onCreateAction: (card: Card) => void;
}

export function CardColumn({
  category,
  cards,
  status,
  canVote,
  myVotes,
  canCreateAction,
  onAdd,
  onVote,
  onCreateAction,
}: Props) {
  const meta = CATEGORY_META[category];

  const sorted = [...cards].sort((a, b) => {
    if (status === "writing") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return b.votes - a.votes;
  });

  return (
    <div className={`${meta.bg} ${meta.border} border rounded-2xl p-4 flex flex-col gap-3 min-h-[24rem]`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-bold ${meta.text}`}>{meta.label}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${meta.chip}`}>{cards.length}</span>
      </div>

      {status === "writing" && <AddCardInput category={category} onAdd={onAdd} />}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-6">Henüz kart yok.</p>
        )}
        {sorted.map((card) => (
          <RetroCard
            key={card.id}
            card={card}
            isVoting={status === "voting"}
            isFinished={status === "finished"}
            canVote={canVote}
            myVotes={myVotes[card.id] ?? 0}
            canCreateAction={canCreateAction}
            onVote={() => onVote(card.id)}
            onCreateAction={() => onCreateAction(card)}
          />
        ))}
      </div>
    </div>
  );
}
