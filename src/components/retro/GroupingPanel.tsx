"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Card, CardGroup } from "@/types";

interface Props {
  groupingMode: boolean;
  onToggleMode: () => void;
  selectedCards: Card[];
  groups: CardGroup[];
  onCreateGroup: (name: string, cardIds: string[]) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onCreateGroupAction: (group: CardGroup) => void;
  cardsByGroup: Record<string, Card[]>;
  onClearSelection: () => void;
}

export function GroupingPanel({
  groupingMode,
  onToggleMode,
  selectedCards,
  groups,
  onCreateGroup,
  onDeleteGroup,
  onCreateGroupAction,
  cardsByGroup,
  onClearSelection,
}: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Grup adı boş olamaz");
    if (selectedCards.length === 0) return setError("En az bir kart seçmelisin");
    setBusy(true);
    setError(null);
    try {
      await onCreateGroup(
        trimmed,
        selectedCards.map((c) => c.id),
      );
      setName("");
      onClearSelection();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-purple-900">Kart Gruplama</h3>
          <p className="text-xs text-purple-700">
            {groupingMode
              ? "Kartlara tıklayıp gruba ekle, sonra grup adı ver."
              : "Modu açarak benzer kartları gruplayabilirsin."}
          </p>
        </div>
        <Button
          variant={groupingMode ? "primary" : "secondary"}
          size="sm"
          onClick={onToggleMode}
        >
          {groupingMode ? "Modu Kapat" : "Gruplama Modu"}
        </Button>
      </div>

      {groupingMode && (
        <div className="space-y-2">
          <div className="text-xs text-purple-800">
            Seçili: <strong>{selectedCards.length}</strong> kart
            {selectedCards.length > 0 && (
              <button
                onClick={onClearSelection}
                className="ml-2 text-xs underline hover:text-purple-900"
              >
                temizle
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Grup adı (ör: Standup'lar)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) submit();
              }}
            />
            <Button onClick={submit} disabled={busy || selectedCards.length === 0}>
              {busy ? "..." : "+ Grup"}
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}

      {groups.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-purple-200">
          <h4 className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
            Mevcut Gruplar ({groups.length})
          </h4>
          <div className="space-y-2">
            {groups.map((g) => {
              const groupCards = cardsByGroup[g.id] ?? [];
              return (
                <div
                  key={g.id}
                  className="bg-white border border-purple-200 rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">📦 {g.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {groupCards.length} kart
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => onCreateGroupAction(g)}
                      disabled={groupCards.length === 0}
                    >
                      + Aksiyon
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`"${g.name}" grubunu sil?`)) onDeleteGroup(g.id);
                      }}
                    >
                      🗑
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
