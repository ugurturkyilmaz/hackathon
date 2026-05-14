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
      if (!res.ok || body.error) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setResult(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            ✨ AI Analizi
          </h2>
          <p className="text-sm text-indigo-700">
            Tüm aksiyon maddelerinin özetini, riskleri ve önerileri Groq llama-3.1-8b-instant modelinden al.
          </p>
        </div>
        <Button onClick={analyze} disabled={loading}>
          {loading ? "Analiz ediliyor..." : "🪄 Analiz Et"}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-indigo-700">
          <Spinner size={16} />
          <span>Yapay zeka model çağrısı yapılıyor...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          ❌ {error}
        </div>
      )}

      {result && !loading && (
        <div className="bg-white border border-indigo-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-2">
            {result.action_count} aksiyon · model: {result.model}
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-900 leading-relaxed">
            {result.analysis}
          </div>
        </div>
      )}
    </div>
  );
}
