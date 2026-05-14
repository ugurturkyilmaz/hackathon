# CLAUDE.md — AI Geliştirme Yönergesi

> Bu dosya, Claude Code (Anthropic'in CLI ajanı) ve diğer AI asistanlarının
> bu repoyu nasıl genişletip değiştireceğine dair yönergeleri içerir.
> İnsan geliştiricinin de hızlı bir şekilde proje normlarını anlaması için
> referans noktasıdır.

---

## 🎯 Proje Bağlamı

**Retroflow** — takım retrospektif platformu. Stack:

- **Next.js 15 (App Router)** + TypeScript + Tailwind CSS
- **better-sqlite3** (local SQLite, auto-migrate)
- **Server-Sent Events** (in-memory pub/sub ile realtime)
- **Groq** API (`llama-3.1-8b-instant`) — yönetici dashboard'unda AI analizi

Detaylı mimari: [`docs/01-ARCHITECTURE.md`](docs/01-ARCHITECTURE.md)

---

## 🤖 AI Geliştirme Pipeline'ı

| Aşama | Kullanılan Model | Çıktı |
|---|---|---|
| **Planlama / scoping** | **Google Gemini** | `docs/00-PLAN.md`, `docs/02-PHASES.md`, `docs/03-TASKS.md` |
| **Skill & agent profilleri** | **Claude Opus 4.7 (1M context)** | `docs/*-agent.md`, `docs/skills/*/SKILL.md` |
| **Kod implementasyonu, refactor, debug** | **Claude Code (Sonnet/Opus)** | `src/**` tüm uygulama kodu |
| **Yönetici dashboard analizi (runtime)** | **Groq llama-3.1-8b-instant** | `/api/analyze` route'undan dönen kısa analiz |

Tüm commit'ler `Co-Authored-By: Claude Opus 4.7 (1M context)` trailer'ı ile imzalanmıştır.

---

## 🔌 MCP (Model Context Protocol) Server'ları

Geliştirme sırasında bağlı olan MCP server'lar:

| MCP | Kullanım |
|---|---|
| **github-mcp-server** (`ghcr.io/github/github-mcp-server`) | Tüm push'lar, repo oluşturma, branch yönetimi, issue/PR, dosya okuma — fine-grained PAT ile |

MCP yapılandırması yerel (`~/Library/Application Support/Claude/claude_desktop_config.json`) — repoya commit edilmez (token içerir).

---

## 🌐 Runtime API Entegrasyonları

| API | Endpoint | Kullanım |
|---|---|---|
| **Groq Chat Completions** | `https://api.groq.com/openai/v1/chat/completions` | Manager dashboard'daki "Analiz Et" butonu — açık aksiyonları AI'a özetletir |

API key `.env.local` (gitignore'lı). `.env.example` placeholder içerir.

---

## 📐 Kod Konvansiyonları (Claude için kurallar)

### Dosya yerleşimi
- Tüm yeni rota: `src/app/api/.../route.ts` (Next.js Route Handler)
- Yeni hook: `src/lib/hooks/useFoo.ts` (`'use client'` direktifi şart)
- Yeni UI bileşeni: `src/components/<domain>/Foo.tsx`
- Yeni domain tipi: `src/types/index.ts` içine ekle

### DB
- Şema değişikliği: **`src/lib/db/client.ts`'deki `migrate()`** içine `ensureColumn` veya yeni `CREATE TABLE` ekle (idempotent olmalı)
- Yeni CRUD: `src/lib/db/repo.ts` — sıkı şekilde tipli prepared statement'lar
- Mutasyon sonrası SSE event: `publish(topic, payload)` çağır

### Realtime
- Yeni kanal: `src/lib/db/sse.ts`'i kullan, yeni route handler aç
- Client-side: hook içinde `EventSource` aç, `useEffect` cleanup'ında kapat

### UI prensipleri
- Tailwind utility-first; özel CSS yok
- Loading skeleton'ları: `<Spinner />` veya `<FullPageSpinner />`
- Hata durumları: kırmızı border + bg-red-50 div, sessiz hata yok
- Empty states: `<Empty />` bileşeni
- Modal: `<Modal />` (escape-to-close + body scroll lock dahil)

### TypeScript
- `strict: false` (hackathon hızı). Production öncesi açılmalı.
- `any` kaçın; gerekiyorsa lokal `unknown` cast yap

### Testing
- Hackathon — unit/e2e test **yok**
- Doğrulama: `npm run typecheck && npm run build` her büyük değişiklikten sonra

---

## 🚦 Build / Deploy

```bash
npm run typecheck   # tsc --noEmit
npm run build       # next build (lint+ts hatalarını ignore eder; demo için)
npm run dev         # localhost:3000
npm run seed        # DB sıfırla, demo kullanıcıları + örnek retro yükle
```

**Vercel'de çalışmaz** — `better-sqlite3` filesystem'e yazıyor, serverless'te ephemeral.
Local demo için optimize.

---

## 📚 Daha Fazla

- [`README.md`](README.md) — kullanıcı + jüri için genel bakış
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — sürüm geçmişi (v0.1 → v0.7)
- [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md) — AI'ın geliştirme sürecine nasıl entegre edildiğinin detaylı anlatımı
- [`docs/skills/`](docs/skills/) — Tekrar kullanılabilir skill kütüphanesi
- [`docs/*-agent.md`](docs/) — Rol bazlı agent profilleri (backend, frontend, db, devops, reviewer)
