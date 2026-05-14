"use client";

import { Button } from "@/components/ui/Button";
import { CATEGORY_META } from "@/lib/utils/constants";
import type { Card } from "@/types";

interface Props {
  card: Card;
  isVoting: boolean;
  isFinished: boolean;
  canVote: boolean;
  myVotes: number;
  canCreateAction: boolean;
  onVote: () => void;
  onCreateAction: () => void;
}

export function RetroCard({
  card,
  isVoting,
  isFinished,
  canVote,
  myVotes,
  canCreateAction,
  onVote,
  onCreateAction,
}: Props) {
  const meta = CATEGORY_META[card.category];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 space-y-2 hover:shadow-md transition-shadow duration-150">
      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{card.text}</p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${meta.chip}`}>
            👍 {card.votes}
          </span>
          {myVotes > 0 && (
            <span className="text-gray-500">senin: {myVotes}</span>
          )}
        </div>

        {isVoting && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onVote}
            disabled={!canVote}
            aria-label="Oy ver"
          >
            👍 Oy
          </Button>
        )}

        {isFinished && canCreateAction && (
          <Button variant="primary" size="sm" onClick={onCreateAction}>
            + Aksiyon
          </Button>
        )}
      </div>
    </div>
  );
}
