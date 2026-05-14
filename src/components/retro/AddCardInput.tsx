"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { CATEGORY_META } from "@/lib/utils/constants";
import type { Category } from "@/types";

interface Props {
  category: Category;
  onAdd: (text: string, category: Category) => Promise<void>;
}

export function AddCardInput({ category, onAdd }: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(trimmed, category);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        placeholder={CATEGORY_META[category].placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        className="text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button
        variant="secondary"
        size="sm"
        onClick={submit}
        disabled={submitting || !text.trim()}
        className="w-full"
      >
        {submitting ? "Ekleniyor..." : "+ Kart Ekle"}
      </Button>
    </div>
  );
}
