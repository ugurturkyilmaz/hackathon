"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface Result {
  analysis: string;
  action_count: number;
  model: string;
}

export function AiAnalysisPanel() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const body = (await res.json()) as Result & { error?: string };
      if (!res.ok || body.error) throw new Error(body.error || `HTTP ${res.status}`);
      setResult(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-indigo-100 bg-white/60 backdrop-blur">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            <span className="inline-flex w-7 h-7 rounded-lg bg-indigo-600 text-white items-center justify-center text-sm shadow-sm">
              AI
            </span>
            Aksiyon Analizi
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tüm açık ve gecikmiş aksiyonları yapay zeka ile özetle, ekip için öncelikleri çıkar.
          </p>
        </div>
        <Button onClick={analyze} disabled={loading}>
          {loading ? "Analiz ediliyor..." : "Analiz Et"}
        </Button>
      </div>

      {/* Body */}
      <div className="p-5">
        {!loading && !error && !result && (
          <div className="text-sm text-gray-500 italic">
            Henüz analiz yapılmadı. <strong className="text-gray-700">Analiz Et</strong> butonuna
            tıkla.
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-indigo-700">
            <Spinner size={18} />
            <span>Yapay zeka modeli çalışıyor, birkaç saniye sürebilir...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            ❌ {error}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                {result.action_count} aksiyon
              </span>
              <span className="text-gray-400">·</span>
              <span>{result.model}</span>
            </div>
            <FormattedAnalysis text={result.analysis} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Tiny markdown-ish renderer: handles **bold**, bullets, headings,
// and strips stray `*` / `#` characters that LLMs sprinkle around.
// ---------------------------------------------------------------

function FormattedAnalysis({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return (
            <h3
              key={i}
              className="text-sm font-semibold text-indigo-900 mt-3 first:mt-0 tracking-tight"
            >
              {renderInline(b.text)}
            </h3>
          );
        }
        if (b.type === "bullets") {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {b.items.map((it, j) => (
                <li
                  key={j}
                  className="text-sm text-gray-800 flex items-start gap-2 leading-relaxed"
                >
                  <span className="text-indigo-500 mt-0.5 flex-shrink-0">●</span>
                  <span>{renderInline(it)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm text-gray-800 leading-relaxed">
            {renderInline(b.text)}
          </p>
        );
      })}
    </div>
  );
}

type Block =
  | { type: "heading"; text: string }
  | { type: "para"; text: string }
  | { type: "bullets"; items: string[] };

function parseBlocks(input: string): Block[] {
  const lines = input.split(/\r?\n/);
  const blocks: Block[] = [];
  let currentBullets: string[] | null = null;

  const flushBullets = () => {
    if (currentBullets && currentBullets.length) {
      blocks.push({ type: "bullets", items: currentBullets });
    }
    currentBullets = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      continue;
    }

    // Heading: starts with # or ends with :
    if (/^#{1,6}\s+/.test(line)) {
      flushBullets();
      blocks.push({ type: "heading", text: line.replace(/^#{1,6}\s+/, "") });
      continue;
    }

    // Bullet: -, *, • or numbered "1."
    const bulletMatch = line.match(/^(?:[-*•]\s+|\d+[.)]\s+)(.*)/);
    if (bulletMatch) {
      if (!currentBullets) currentBullets = [];
      currentBullets.push(bulletMatch[1]);
      continue;
    }

    // Heading-like line ending with ":" and short → treat as heading
    if (line.endsWith(":") && line.length < 80 && !line.includes(".")) {
      flushBullets();
      blocks.push({ type: "heading", text: line.replace(/:$/, "") });
      continue;
    }

    flushBullets();
    blocks.push({ type: "para", text: line });
  }
  flushBullets();
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  // Strip leftover markdown markers but keep semantic emphasis for **bold**.
  // Split on **...** segments and render those as <strong>.
  const cleaned = text
    .replace(/\*{3,}/g, "")
    .replace(/_{3,}/g, "")
    .replace(/`/g, "")
    .replace(/#{1,6}/g, "");

  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(cleaned)) !== null) {
    if (m.index > lastIndex) {
      parts.push(stripStars(cleaned.slice(lastIndex, m.index)));
    }
    parts.push(
      <strong key={key++} className="font-semibold text-gray-900">
        {stripStars(m[1])}
      </strong>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < cleaned.length) {
    parts.push(stripStars(cleaned.slice(lastIndex)));
  }
  return parts;
}

function stripStars(s: string): string {
  // Remove any leftover stray asterisks/underscores that weren't part of a pair.
  return s.replace(/[*_]/g, "");
}
