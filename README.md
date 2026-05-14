# 🔄 Retroflow — Takım Retrospektif Platformu

> Ekiplerin retrospektif toplantılarını dijital olarak yönettiği, alınan aksiyon maddelerinin sprintten sprinte takip edildiği MVP.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · **SQLite (better-sqlite3)** · **Server-Sent Events**

> ⚠️ Bu repo başlangıçta Supabase ile yazıldı, sonradan **local SQLite + Next.js Route Handlers + SSE**'ye taşındı. Vercel/serverless'te çalışmaz; localhost demo'su için.

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

# 2. DB'yi sıfırla ve demo kullanıcıları yükle
npm run seed

# 3. Geliştirme sunucusu
npm run dev
# → http://localhost:3000
```

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

## 📚 Dokümantasyon

Plan ve mimari detayları için `docs/` klasörüne bakın:

- [`00-PLAN.md`](docs/00-PLAN.md), [`01-ARCHITECTURE.md`](docs/01-ARCHITECTURE.md), [`02-PHASES.md`](docs/02-PHASES.md), [`03-TASKS.md`](docs/03-TASKS.md)
- [`04-DATABASE.md`](docs/04-DATABASE.md) — orijinal Supabase şeması (geçişten önceki)
- [`05-DEPLOYMENT.md`](docs/05-DEPLOYMENT.md), [`06-TECH-STACK.md`](docs/06-TECH-STACK.md)
- [`CHANGELOG.md`](docs/CHANGELOG.md) — Hackathon sırasında yapılan değişikliklerin tarihçesi
- `docs/skills/` — Reusable skill kütüphanesi
- `docs/*-agent.md` — Rol bazlı AI agent profilleri

---

## 📝 Lisans

MIT — hackathon demosu.
