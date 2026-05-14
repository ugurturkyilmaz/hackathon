"use client";

import { useMemo, useState } from "react";
import { CardColumn } from "./CardColumn";
import { ActionForm } from "./ActionForm";
import { GroupingPanel } from "./GroupingPanel";
import { useCards } from "@/lib/hooks/useCards";
import { useVoting } from "@/lib/hooks/useVoting";
import { useGroups } from "@/lib/hooks/useGroups";
import { Spinner } from "@/components/ui/Spinner";
import { Empty } from "@/components/ui/Empty";
import type { Card, CardGroup, Category, RetroSession, Role } from "@/types";

interface Props {
  session: RetroSession;
  currentUser: { id: string; role: Role };
}

interface ActionTarget {
  card?: Card;
  group?: { group: CardGroup; cards: Card[] };
}

export function RetroBoard({ session, currentUser }: Props) {
  const { cards, loading, error, addCard, voteCard } = useCards(session.id);
  const { myVotes, remainingVotes, canVote, recordVote } = useVoting(
    session.id,
    session.vote_limit,
  );
  const { groups, createGroup, deleteGroup } = useGroups(session.id);

  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [groupingMode, setGroupingMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const canCreateAction = currentUser.role === "scrum_master" || currentUser.role === "admin";
  const canWriteOrVote = currentUser.role === "scrum_master" || currentUser.role === "member";
  const canGroup =
    session.status === "finished" &&
    (currentUser.role === "scrum_master" || currentUser.role === "admin");

  const groupsById = useMemo(() => {
    const map: Record<string, CardGroup> = {};
    for (const g of groups) map[g.id] = g;
    return map;
  }, [groups]);

  const cardsByGroup = useMemo(() => {
    const map: Record<string, Card[]> = {};
    for (const c of cards) {
      if (c.group_id) {
        (map[c.group_id] ||= []).push(c);
      }
    }
    return map;
  }, [cards]);

  const onAdd = async (text: string, category: Category) => {
    await addCard(text, category, currentUser.id);
  };

  const onVote = async (cardId: string) => {
    if (!canVote || !canWriteOrVote) return;
    await voteCard(cardId);
    recordVote(cardId);
  };

  const onToggleSelect = (cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
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
  const selectedCards = cards.filter((c) => selectedIds.has(c.id));

  return (
    <div className="space-y-4">
      {session.status === "writing" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
          Yazma aşaması — başkalarının kartları oylama açılana kadar bulanık görünür.
        </div>
      )}

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
          Bu retro tamamlandı. Tüm kartlar herkese açık.
        </div>
      )}

      {canGroup && (
        <GroupingPanel
          groupingMode={groupingMode}
          onToggleMode={() => {
            setGroupingMode((v) => !v);
            setSelectedIds(new Set());
          }}
          selectedCards={selectedCards}
          groups={groups}
          cardsByGroup={cardsByGroup}
          onCreateGroup={createGroup}
          onDeleteGroup={deleteGroup}
          onCreateGroupAction={(g) =>
            setActionTarget({
              group: { group: g, cards: cardsByGroup[g.id] ?? [] },
            })
          }
          onClearSelection={() => setSelectedIds(new Set())}
        />
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
              currentUserId={currentUser.id}
              canVote={canVote && canWriteOrVote}
              myVotes={myVotes}
              canCreateAction={canCreateAction}
              groupingMode={groupingMode}
              selectedIds={selectedIds}
              groupsById={groupsById}
              onAdd={onAdd}
              onVote={onVote}
              onCreateAction={(card) => setActionTarget({ card })}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}

      {actionTarget && (
        <ActionForm
          card={actionTarget.card}
          group={actionTarget.group}
          onClose={() => setActionTarget(null)}
        />
      )}
    </div>
  );
}
