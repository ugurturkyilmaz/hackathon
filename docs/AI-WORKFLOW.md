# 🤖 AI Workflow — Geliştirme Sürecinde Yapay Zekâ Kullanımı

Bu doküman, Retroflow'un baştan sona nasıl AI-destekli geliştirildiğini, hangi modelin hangi aşamada kullanıldığını ve süreci yönlendiren prompt / config dosyalarını anlatır. Hackathon jürisinin (AI Jüri) puanlamada kullanması için referans noktasıdır.

---

## 🧭 Genel Akış

```
┌──────────────────────────────────────────────────────────────────┐
│  Aşama 1 — PLANLAMA                                              │
│  Model: Google Gemini                                            │
│  Çıktı: docs/00-PLAN.md, 02-PHASES.md, 03-TASKS.md, 04-DATABASE  │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  Aşama 2 — AGENT & SKILL TASARIMI                                │
│  Model: Claude Opus 4.7 (1M context)                             │
│  Çıktı: docs/*-agent.md (5 dosya), docs/skills/*/SKILL.md (4)    │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  Aşama 3 — KOD ÜRETİMİ                                           │
│  Tool:  Claude Code (CLI)                                        │
│  Model: Claude Sonnet / Opus 4.7                                 │
│  Çıktı: src/** tüm uygulama, CHANGELOG, README                   │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  Aşama 4 — RUNTIME ANALİZ                                        │
│  Model: Groq llama-3.1-8b-instant                                │
│  Yer:   /api/analyze, AiAnalysisPanel                            │
│  Tetik: Manager "Analiz Et" butonuna tıklar                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Aşama 1: Planlama (Gemini)

Hackathon başlangıcında, problem ve çözüm sınırlarını netleştirmek + 3 saatlik fazlama yapmak için **Google Gemini** kullanıldı.

**Üretilen dosyalar:**
- [`docs/00-PLAN.md`](00-PLAN.md) — vizyon, MVP kapsamı, başarı kriterleri, demo senaryosu
- [`docs/01-ARCHITECTURE.md`](01-ARCHITECTURE.md) — sistem mimarisi
- [`docs/02-PHASES.md`](02-PHASES.md) — 7 fazlı zaman bütçesi (180 dk)
- [`docs/03-TASKS.md`](03-TASKS.md) — 47 detaylı task breakdown
- [`docs/04-DATABASE.md`](04-DATABASE.md) — başlangıçtaki Supabase şeması
- [`docs/05-DEPLOYMENT.md`](05-DEPLOYMENT.md) — deploy adımları
- [`docs/06-TECH-STACK.md`](06-TECH-STACK.md) — teknoloji seçim gerekçeleri

> **Not:** Plan başlangıçta Supabase üzerine kurguludaydı. Geliştirme sırasında Vercel build hatası nedeniyle local SQLite + SSE'ye taşındı (bkz. [`CHANGELOG.md`](CHANGELOG.md)).

---

## 2️⃣ Aşama 2: Agent ve Skill Profilleri (Claude Opus 4.7)

Geliştirme sürecinde hangi rol nelerden sorumlu, hangi pattern hangi durumda kullanılmalı sorularını netleştirmek için **Claude Opus 4.7 (1M context)** ile 5 agent profili + 4 reusable skill üretildi.

### Agent profilleri (`docs/*-agent.md`)

| Agent | Sorumluluk |
|---|---|
| [`backend-agent.md`](backend-agent.md) | DB layer, repo fonksiyonları, hook yazımı |
| [`frontend-agent.md`](frontend-agent.md) | UI bileşenleri, Tailwind, layout, responsive |
| [`db-agent.md`](db-agent.md) | Şema tasarımı, migration, index, RLS |
| [`devops-agent.md`](devops-agent.md) | Build, deploy, env vars, git hijyeni |
| [`reviewer-agent.md`](reviewer-agent.md) | Kod kalitesi, demo akış prova, edge case avı |

### Skill kütüphanesi (`docs/skills/<name>/SKILL.md`)

| Skill | Tetiklendiği Durum |
|---|---|
| [`nextjs-app-router`](skills/nextjs-app-router/SKILL.md) | Yeni sayfa, layout, dynamic route, server vs client component |
| [`realtime-subscriptions`](skills/realtime-subscriptions/SKILL.md) | Postgres changes / SSE pattern, channel cleanup, dedupe |
| [`retro-flow-logic`](skills/retro-flow-logic/SKILL.md) | Faz state machine, voting limit, action conversion |
| [`role-based-access`](skills/role-based-access/SKILL.md) | Login, useCurrentUser, RoleGuard, conditional UI |
| [`SKILL.md`](SKILL.md) | (kök) Supabase setup — başlangıçtaki backend için |

Bu dosyalar Claude Code'un tetiklenebilir skill repository'si gibi davranır: Claude bir görev gördüğünde uygun skill'i bulup pattern'i uygular.

---

## 3️⃣ Aşama 3: Kod Üretimi (Claude Code)

Gerçek implementasyon **Claude Code CLI** üzerinden yapıldı. Model: **Claude Sonnet 4.5** ve büyük refactor'larda **Opus 4.7**.

### Tipik akış
1. Kullanıcı (insan) Türkçe istek yazar ("X özelliğini ekle")
2. Claude kodu okuyup planı içselleştirir, gerekirse `Plan` veya `Explore` subagent açar
3. Dosyaları `Edit`/`Write` ile değiştirir
4. `npm run typecheck && npm run build` ile doğrular
5. Conventional commit + GitHub MCP üzerinden push

### MCP entegrasyonu
- **github-mcp-server** (`ghcr.io/github/github-mcp-server` Docker image) — repo push, branch yönetimi, dosya okuma
- Yapılandırma: `~/Library/Application Support/Claude/claude_desktop_config.json` (repo'ya commit edilmez)

### Commit imzası
Tüm commit'ler şu trailer ile:
```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

`git log --oneline | head -20` ile geliştirme adımlarının tarihçesi takip edilebilir.

---

## 4️⃣ Aşama 4: Runtime AI (Groq)

Manager dashboard'undaki **"Analiz Et"** butonu, açık + gecikmiş aksiyonları derleyip Groq API'ye gönderir.

- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Model:** `llama-3.1-8b-instant` (Groq'un OpenAI-compatible inference platformunda)
- **Sebep:** ~200-500 ms yanıt — demo'da "wow" anı için hızlı
- **Prompt stratejisi:** kompakt Türkçe sistem mesajı + numaralı aksiyon listesi → kısa madde madde özet bekle (bkz. `src/app/api/analyze/route.ts`)
- **Output renderer:** `src/components/dashboard/AiAnalysisPanel.tsx` içinde kendi mini markdown parser'ı (bold + bullets + heading) — model çıktısındaki stray `*` ve `#` karakterlerini temizler

### Güvenlik
- API key `.env.local`'de (gitignore'da)
- `.env.example` placeholder içerir
- Sunucu tarafında çağrılır; key tarayıcıya sızdırılmaz

---

## 📂 İlgili Dosyalar Hızlı Referans

| Dosya | Amaç |
|---|---|
| [`/CLAUDE.md`](../CLAUDE.md) | Claude Code için top-level yönerge |
| [`/README.md`](../README.md) | Genel proje + jüri girişi |
| [`docs/CHANGELOG.md`](CHANGELOG.md) | Sürüm geçmişi (v0.1 → v0.7) |
| [`docs/00-PLAN.md`](00-PLAN.md) | Planlama (Gemini çıktısı) |
| [`docs/skills/`](skills/) | Skill kütüphanesi (Opus 4.7 çıktısı) |
| [`src/app/api/analyze/route.ts`](../src/app/api/analyze/route.ts) | Groq entegrasyonu |
| [`src/components/dashboard/AiAnalysisPanel.tsx`](../src/components/dashboard/AiAnalysisPanel.tsx) | AI çıktısının UI render'ı |

---

## 🧪 Doğrulama Adımları (jüri için)

Demo sırasında AI'ın projeye nasıl entegre olduğunu görmek için:

1. **Plan dosyalarını oku** → Gemini çıktısı
2. **Agent + skill profillerini incele** → Opus 4.7 çıktısı
3. **`git log --grep="Co-Authored-By: Claude"`** → Claude Code commit'leri
4. **`/dashboard` → "Analiz Et" butonu** → Groq runtime
5. **`docs/CHANGELOG.md`** → kronolojik AI-destekli geliştirme akışı
