"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useActions, useSessionMembers } from "@/lib/hooks/useActions";
import type { Card } from "@/types";

interface Props {
  card: Card;
  onClose: () => void;
}

export function ActionForm({ card, onClose }: Props) {
  const { addAction } = useActions();
  const members = useSessionMembers();
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const desc = description.trim();
    if (!desc) {
      setError("Açıklama boş olamaz");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addAction({
        card_id: card.id,
        assigned_to: assignedTo || null,
        description: desc,
        deadline: deadline || null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setSubmitting(false);
    }
  };

  const assignableMembers = members.filter((m) => m.role !== "manager");

  return (
    <Modal open onClose={onClose} title="Aksiyon Ekle">
      <p className="text-sm text-gray-600 mb-4">
        Kart: <em>"{card.text}"</em>
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ne yapılacak?</label>
          <Textarea
            rows={3}
            placeholder="Ör: Daily'leri 15 dakikaya düşür"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kim yapacak?</label>
          <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">— Seçilmedi —</option>
            {assignableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ne zamana kadar?</label>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            İptal
          </Button>
          <Button onClick={submit} disabled={submitting} className="flex-1">
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
