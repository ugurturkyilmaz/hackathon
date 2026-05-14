"use client";

import { Button } from "@/components/ui/Button";
import { CATEGORY_META } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import type { Card } from "@/types";

interface Props {
  card: Card;
  isVoting: boolean;
  isFinished: boolean;
  isWriting: boolean;
  isOwn: boolean;
  canVote: boolean;
  myVotes: number;
  canCreateAction: boolean;
  /** SM grouping mode (status=finished) */
  groupingMode?: boolean;
  selectedForGroup?: boolean;
  groupName?: string | null;
  onToggleSelect?: () => void;
  onVote: () => void;
  onCreateAction: () => void;
}

export function RetroCard({
  card,
  isVoting,
  isFinished,
  isWriting,
  isOwn,
  canVote,
  myVotes,
  canCreateAction,
  groupingMode,
  selectedForGroup,
  groupName,
  onToggleSelect,
  onVote,
  onCreateAction,
}: Props) {
  const meta = CATEGORY_META[card.category];

  // Blur kuralı: writing aşamasında, başkasının kartı → blurlu
  const shouldBlur = isWriting && !isOwn;

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border p-3 space-y-2 transition-all duration-150",
        selectedForGroup
          ? "border-indigo-500 ring-2 ring-indigo-300 shadow-md"
          : "border-gray-200 hover:shadow-md",
        groupingMode ? "cursor-pointer" : "",
      )}
      onClick={groupingMode ? onToggleSelect : undefined}
    >
      <p
        className={cn(
          "text-sm text-gray-900 whitespace-pre-wrap break-words",
          shouldBlur && "blur-sm select-none pointer-events-none",
        )}
        aria-hidden={shouldBlur}
      >
        {shouldBlur ? "•••••••••• ••••••• •••••" : card.text}
      </p>

      {groupName && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          📦 {groupName}
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${meta.chip}`}
          >
            👍 {card.votes}
          </span>
          {myVotes > 0 && <span className="text-gray-500">senin: {myVotes}</span>}
          {isOwn && isWriting && (
            <span className="text-xs text-gray-400 italic">(senin kartın)</span>
          )}
        </div>

        {isVoting && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onVote();
            }}
            disabled={!canVote}
            aria-label="Oy ver"
          >
            👍 Oy
          </Button>
        )}

        {isFinished && canCreateAction && !groupingMode && (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCreateAction();
            }}
          >
            + Aksiyon
          </Button>
        )}
      </div>
    </div>
  );
}
