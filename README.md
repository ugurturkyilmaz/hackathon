# 🔄 Retroflow — Takım Retrospektif Platformu

> Ekiplerin retrospektif toplantılarını dijital olarak yönettiği, alınan aksiyon maddelerinin sprintten sprinte takip edildiği MVP.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · **SQLite (better-sqlite3)** · **Server-Sent Events** · **Groq AI**

> ⚠️ Bu repo başlangıçta Supabase ile yazıldı, sonradan **local SQLite + Next.js Route Handlers + SSE**'ye taşındı. Vercel/serverless'te çalışmaz; localhost demo'su için.

**☁️ Deploy URL:** _Yok_ — `better-sqlite3` filesystem'e yazıyor; serverless ortamlarda çalışmaz. Localhost'ta `npm run dev` ile çalıştırılır. (Production hedeflenirse libsql/Turso veya managed Postgres'e taşıma gerekir.)

---

## 🎯 Problem

Ekipler retrospektif toplantılarını dış platformlarda yapıyor; alınan aksiyon maddeleri toplantı bitince havada kalıyor, sprint'ten sprint'e takip edilemiyor.

## ✅ Çözüm

- Retro odası → **Mad / Glad / Sad** kartları
- **Yazma → Oylama → Bitir** aşamalı akışı + canlı sayaç
- Yazma aşamasında **başkalarının kartı bulanık**, sürpriz bozulmasın
- SM kartları **gruplayabilir**, her grup için aksiyon açabilir
- Aksiyonlar **default 7 gün** deadline ile kayıt; gecikenler **popup ile uyarılır**
- **Önceki retronun aksiyonları** yeni retronun başında görünür → unutulmasın
- Admin **ekipleri yönetir**: SM atar, üye seçer
- Yöneticilere read-only **executive dashboard**

---

## 👥 Roller

| Rol | Yetki |
|---|---|
| **Admin** | Ekip oluşturur, SM atar, üye seçer; tüm dashboard'ları görür |
| **Scrum Master** | Ekibi için retro açar, faz değiştirir, kart gruplar, aksiyon atar |
| **Ekip Üyesi** | Kart yazar, oy verir |
| **Yönetici (Manager)** | Read-only — tüm aksiyon listesi + uyarı popup'ları |

---

## 🚀 Hızlı Başlangıç

```bash
# 1. Bağımlılıklar (Node 20+; better-sqlite3 native binding için)
npm install

# 2. Environment değişkenleri (Groq API key için — opsiyonel ama AI Analiz butonu için gerekli)
cp .env.example .env.local
# .env.local içine GROQ_API_KEY=gsk_... yaz (https://console.groq.com/keys)

# 3. DB'yi sıfırla ve demo kullanıcıları + örnek retroyu yükle
npm run seed

# 4. Geliştirme sunucusu
npm run dev
# → http://localhost:3000
```

> 📋 [`.env.example`](.env.example) dosyası gerekli env değişkenlerini placeholder ile listeler.

İlk açılışta **isim + rol seçim** ekranı çıkar. Aşağıdaki demo isimlerinden biriyle gir:

| Rol | İsimler |
|---|---|
| Admin | `admin` |
| Yönetici (Manager) | `Kaan`, `Batuhan`, `Çağrı` |
| Scrum Master | `Erhan` |
| Ekip Üyesi | `Kübra`, `Zeynep`, `Anıl`, `Uğur` |

> İstediğin zaman `/admin` sayfasındaki **🔄 Reset & Seed** butonuyla sıfırlayabilirsin.

---

## 🎬 Demo Akışı

1. `admin` olarak gir → `/admin/teams` → **Falcon Team** oluştur, SM olarak `Erhan` ata
2. Aynı sayfada `Kübra`, `Zeynep`, `Anıl`, `Uğur`'u Falcon Team'e ekle
3. Yeni sekme (incognito) → `Erhan` olarak gir → **+ Yeni Retro** → "Sprint 12" → süre 5 dk
4. Diğer sekmelerde `Kübra`, `Zeynep` olarak gir → board'u gör
5. Yazma fazı: kartlar yazılır; **kendi kartın görünür, başkalarınınki bulanık**; üst köşede ⏱ sayaç
6. Erhan **Oylamaya Geç** → kartlar netleşir, oy butonları çıkar; herkes oy verir
7. Erhan **Bitir** → "Gruplama Modu" aç → benzer kartları seç + grup adı ver
8. Her grupta **+ Aksiyon** → varsayılan **7 gün deadline** prefill'lenir
9. Yönetici sekmesi (`Kaan`) → giriş anında 🔔 popup ile gecikmiş/yaklaşan aksiyonlar gözükür → `/dashboard`'da hepsi listede
10. Sonraki retroda yazma fazının üstünde **önceki retronun aksiyonları** banner olarak gösterilir

---

## 🏗️ Mimari

```
┌──────────── Browser ─────────────┐
│  Next.js Client Components       │
│  - Pages (App Router)            │
│  - Hooks (fetch + EventSource)   │
└──────────────┬───────────────────┘
               │
       HTTP / SSE
               │
┌──────────────▼───────────────────┐
│  Next.js Route Handlers (/api)   │
│  - REST endpoints                │
│  - SSE streams (postgres_changes │
│    eşdeğeri, in-memory pub/sub)  │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│  better-sqlite3 (./data/*.db)    │
│  - Auto-migrate on first import  │
│  - WAL mode, FK on               │
└──────────────────────────────────┘
```

### 📁 Klasör

```
src/
├── app/
│   ├── api/                      ← REST + SSE endpoints
│   │   ├── users, teams, sessions, cards, actions, groups
│   │   └── admin/seed
│   ├── admin/                    ← /admin (kullanıcılar) + /admin/teams
│   ├── dashboard/                ← Manager executive view
│   ├── retro/                    ← Liste + /new + /[id] (board)
│   └── page.tsx                  ← Login
├── components/
│   ├── ui/                       ← Button, Input, Modal, Empty, Spinner
│   ├── layout/Header.tsx         ← Logo, role badge, alerts, logout
│   ├── ActionAlerts.tsx          ← 🔔 Deadline popup (header chip + modal)
│   ├── retro/
│   │   ├── RetroBoard.tsx
│   │   ├── CardColumn.tsx
│   │   ├── RetroCard.tsx         ← Blur logic
│   │   ├── AddCardInput.tsx
│   │   ├── PhaseControl.tsx      ← Faz + Timer
│   │   ├── Timer.tsx             ← MM:SS countdown
│   │   ├── GroupingPanel.tsx     ← SM card grouping
│   │   ├── ActionForm.tsx        ← Card OR group hedefli
│   │   └── PreviousActionsPanel.tsx  ← Önceki retro aksiyonları
│   └── dashboard/ActionsTable.tsx
├── lib/
│   ├── db/
│   │   ├── client.ts             ← SQLite singleton + auto-migrate
│   │   ├── repo.ts               ← CRUD + listPreviousSessionActions
│   │   ├── events.ts             ← In-memory pub/sub (SSE backbone)
│   │   ├── sse.ts                ← ReadableStream wrapper
│   │   └── seed.ts               ← Reset + canonical demo users
│   ├── hooks/
│   │   ├── useCurrentUser, useRetroSession, useCards, useVoting
│   │   ├── useActions, useTeams, useGroups
│   │   └── usePreviousActions (inlined in PreviousActionsPanel)
│   ├── utils/
│   │   ├── cn.ts, constants.ts
│   │   └── deadline.ts           ← deadlineMeta + todayPlus
│   └── api.ts                    ← fetch wrapper
└── types/index.ts
```

---

## 🗄️ DB Şeması (SQLite, auto-migrate)

```
users           (id, name UNIQUE, role, team_id, created_at)
teams           (id, name UNIQUE, scrum_master_id → users)
retro_sessions  (id, name, status, vote_limit, writing_minutes,
                 writing_ends_at, team_id → teams, created_by, created_at)
card_groups     (id, session_id → sessions CASCADE, name, created_at)
cards           (id, session_id → sessions CASCADE, text, category,
                 votes, user_id, group_id → card_groups, created_at)
actions         (id, card_id → cards SET NULL, group_id → card_groups SET NULL,
                 assigned_to → users, description, status, deadline, created_at)
```

İlk `getDb()` çağrısında `data/retroflow.db` oluşur, schema migrate edilir. `npm run seed` tüm tabloları temizler ve 9 kanonik kullanıcıyı yükler.

---

## 🔌 Realtime (SSE)

Supabase Realtime'ın `postgres_changes` channel'ına eşdeğer:

| Topic | Yayınlayanlar | Dinleyiciler |
|---|---|---|
| `session:<id>` | session/card/group mutasyonları | Board sayfası |
| `actions` | action insert/update | Dashboard, ActionAlerts |
| `teams` | team mutasyonları | Admin teams page |

Her API route mutasyon yaptığında `publish(topic, payload)` çağırır. SSE stream endpoint'leri (`/api/sessions/[id]/stream`, `/api/actions/stream`) her connected client'a JSON event gönderir.

---

## 🤖 Geliştirmede Kullanılan AI Araçları

| Aşama | Araç / Model | Çıktı |
|---|---|---|
| **Planlama, dokümantasyon** | **Google Gemini** | `docs/00-PLAN.md`, `docs/02-PHASES.md`, `docs/03-TASKS.md`, `docs/04-DATABASE.md` |
| **Skill & Agent profilleri** | **Claude Opus 4.7 (1M context)** | `docs/*-agent.md`, `docs/skills/*/SKILL.md` |
| **Kod üretimi & refactor** | **Claude Code (Sonnet 4.5 / Opus 4.7)** | `src/**` tüm uygulama kodu |
| **Runtime aksiyon analizi** | **Groq · `llama-3.1-8b-instant`** | Manager dashboard'undaki "Analiz Et" çıktısı |

Tüm AI-destekli commit'ler `Co-Authored-By: Claude Opus 4.7 (1M context)` trailer'ı ile imzalanmıştır. `git log --grep="Co-Authored-By: Claude"` ile gözlenebilir.

Detaylı AI iş akışı: [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md).
Top-level Claude yönergesi: [`CLAUDE.md`](CLAUDE.md).

---

## 🔌 MCP (Model Context Protocol) Server'ları

| MCP | Image / Source | Kullanım |
|---|---|---|
| **github-mcp-server** | `ghcr.io/github/github-mcp-server` (Docker) | Repo push, branch/file yönetimi, PR oluşturma. Claude Code içinden Anthropic'in MCP entegrasyonu üzerinden çağrıldı. |

MCP yapılandırma dosyası lokal: `~/Library/Application Support/Claude/claude_desktop_config.json` (token içerir, repo'ya commit edilmez).

---

## 🌐 Entegre Edilen API'ler

| API | Endpoint | Amaç |
|---|---|---|
| **Groq Chat Completions** | `https://api.groq.com/openai/v1/chat/completions` | Manager dashboard'unda açık aksiyonların AI özetini almak |
| **GitHub REST API** (MCP üzerinden) | `https://api.github.com` | Repo push, dosya commit'leri (sadece geliştirme zamanı) |

Groq integration kodu: [`src/app/api/analyze/route.ts`](src/app/api/analyze/route.ts).

---

## 📸 Ekran Görüntüleri

> Demo sırasında çekilen ekran görüntüleri için `docs/screenshots/` klasörü ayrılmıştır. (Hackathon sunumu sırasında doldurulacak.)

Önerilen ekranlar:
- 🎬 Login + rol seçim
- 🎬 Admin → Ekipler (Falcon Team yönetimi)
- 🎬 Retro board — yazma fazı (blurred kartlar + ⏱ sayaç)
- 🎬 Retro board — voting + finished + grouping
- 🎬 Manager dashboard — kırmızı çerçeveli gecikmiş aksiyonlar
- 🎬 AI Analiz paneli (Groq çıktısı)
- 🎬 🔔 Deadline uyarı popup'ı

---

## 📚 Dokümantasyon

Plan ve mimari detayları için `docs/` klasörüne bakın:

- [`00-PLAN.md`](docs/00-PLAN.md), [`01-ARCHITECTURE.md`](docs/01-ARCHITECTURE.md), [`02-PHASES.md`](docs/02-PHASES.md), [`03-TASKS.md`](docs/03-TASKS.md) — **Gemini ile üretilen** planlama dokümanları
- [`04-DATABASE.md`](docs/04-DATABASE.md) — orijinal Supabase şeması (geçişten önceki)
- [`05-DEPLOYMENT.md`](docs/05-DEPLOYMENT.md), [`06-TECH-STACK.md`](docs/06-TECH-STACK.md)
- [`AI-WORKFLOW.md`](docs/AI-WORKFLOW.md) — **AI-destekli geliştirme süreci** (jüri için)
- [`CHANGELOG.md`](docs/CHANGELOG.md) — Hackathon sürüm geçmişi (v0.1 → v0.7)
- [`docs/skills/`](docs/skills/) — **Opus 4.7 ile üretilen** reusable skill kütüphanesi (4 skill)
- [`docs/*-agent.md`](docs/) — **Opus 4.7 ile üretilen** rol bazlı agent profilleri (5 agent)
- Root: [`CLAUDE.md`](CLAUDE.md) — Claude Code için top-level kod yönergesi

---

## 📝 Lisans

MIT — hackathon demosu.
