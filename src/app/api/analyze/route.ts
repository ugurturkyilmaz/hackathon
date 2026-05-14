import { NextResponse } from "next/server";
import { listActionsEnriched } from "@/lib/db/repo";
import { deadlineMeta } from "@/lib/utils/deadline";

export const dynamic = "force-dynamic";

export async function POST() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY tanımlı değil. .env.local'i kontrol et." },
      { status: 500 },
    );
  }

  const actions = listActionsEnriched();

  if (actions.length === 0) {
    return NextResponse.json({
      analysis: "Henüz hiç aksiyon yok. Bir retro tamamlanıp aksiyon eklenince analiz alabilirsin.",
      action_count: 0,
    });
  }

  // Compact prompt — kısa input, kısa output
  const lines = actions.map((a, i) => {
    const meta = deadlineMeta(a.deadline, a.status);
    const source = a.group
      ? `📦 ${a.group.name} (${a.group.card_count} kart)`
      : a.card?.text
        ? `🃏 ${a.card.text.slice(0, 80)}`
        : "—";
    return `${i + 1}. [${a.status === "done" ? "✓" : "○"}] "${a.description}" — sorumlu: ${a.assignee?.name ?? "yok"}, deadline: ${a.deadline ?? "yok"} (${meta.label}), retro: ${a.session?.name ?? "—"}, kaynak: ${source}`;
  });

  const userPrompt = `Aşağıda bir yazılım takımının retrospektif çıktılarından oluşan aksiyon listesi var. Yönetici için **çok kısa** bir analiz çıkar (en fazla 6-8 madde). Türkçe yanıtla.

Analiz şunları kapsamalı:
- En kritik gecikmiş veya yaklaşan aksiyonlar
- Ekipte tekrar eden temalar (varsa)
- Sorumlu dağılımındaki dengesizlikler (varsa)
- Yöneticiye 1-2 somut öneri

Aksiyonlar:
${lines.join("\n")}`;

  let groqRes: Response;
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "Sen bir scrum/agile yöneticisi asistanısın. Verilen aksiyon listesini analiz edip yöneticiye kısa, madde madde, eyleme yönelik özet çıkarırsın. Markdown kullan, ama sade.",
          },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Groq API'ye erişilemedi: ${e instanceof Error ? e.message : "ağ hatası"}` },
      { status: 502 },
    );
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return NextResponse.json(
      { error: `Groq ${groqRes.status}: ${errText.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const data = (await groqRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const analysis = data.choices?.[0]?.message?.content ?? "Analiz çıktısı boş döndü.";

  return NextResponse.json({
    analysis,
    action_count: actions.length,
    model: "llama-3.1-8b-instant",
  });
}
