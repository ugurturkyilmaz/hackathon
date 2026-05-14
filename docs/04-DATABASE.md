# 🗄️ 04 — Veritabanı

Supabase PostgreSQL. 4 tablo, RLS hackathon için **kapalı**, Realtime **açık**.

---

## 📐 ER Diyagramı (Mental Model)

```
users                    retro_sessions             cards
─────                    ──────────────             ─────
id (uuid PK)             id (uuid PK)               id (uuid PK)
name                     name                       session_id (FK)
role                     status                     text
created_at               vote_limit                 category
                         created_by (FK→users)      user_id (FK→users, nullable)
                         created_at                 votes (int default 0)
                                                    created_at

                                                    actions
                                                    ───────
                                                    id (uuid PK)
                                                    card_id (FK→cards)
                                                    assigned_to (FK→users)
                                                    description
                                                    deadline (date)
                                                    status (open/done)
                                                    created_at
```

**İlişkiler:**
- `retro_sessions.created_by` → `users.id` (SM kim açtı)
- `cards.session_id` → `retro_sessions.id` (kart hangi retroya ait)
- `cards.user_id` → `users.id` (anonim için nullable)
- `actions.card_id` → `cards.id` (aksiyon hangi karttan çıktı)
- `actions.assigned_to` → `users.id` (kime atandı)

---

## 📜 SQL Script — Tek Seferde Çalıştır

> Supabase Dashboard → SQL Editor → "New query" → aşağıyı yapıştır → "Run"

```sql
-- =============================================
-- RETROFLOW — DATABASE SETUP
-- Tek seferde çalıştır. Idempotent değildir; ikinci kez çalıştırırsan DROP eklemen lazım.
-- =============================================

-- UUID extension (Supabase'de default açık, garantiye)
create extension if not exists "uuid-ossp";

-- ---------------------------------------------
-- TABLE: users
-- ---------------------------------------------
create table public.users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  role        text not null check (role in ('admin', 'scrum_master', 'member', 'manager')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------
-- TABLE: retro_sessions
-- ---------------------------------------------
create table public.retro_sessions (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  status       text not null default 'writing' check (status in ('writing', 'voting', 'finished')),
  vote_limit   int not null default 3,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------
-- TABLE: cards
-- ---------------------------------------------
create table public.cards (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.retro_sessions(id) on delete cascade,
  text        text not null,
  category    text not null check (category in ('mad', 'glad', 'sad')),
  votes       int not null default 0,
  user_id     uuid references public.users(id) on delete set null, -- anonim için nullable
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------
-- TABLE: actions
-- ---------------------------------------------
create table public.actions (
  id           uuid primary key default uuid_generate_v4(),
  card_id      uuid not null references public.cards(id) on delete cascade,
  assigned_to  uuid references public.users(id) on delete set null,
  description  text not null,
  status       text not null default 'open' check (status in ('open', 'done')),
  deadline     date,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------
-- İlk admin kullanıcı (kendi adınla değiştir!)
-- ---------------------------------------------
insert into public.users (name, role)
values ('Uğur Türkyılmaz', 'admin');

-- ---------------------------------------------
-- RLS — Hackathon için TÜMÜNE AÇIK
-- (Production'da kapatıp policy yazılmalı; bu sadece demo!)
-- ---------------------------------------------
alter table public.users          disable row level security;
alter table public.retro_sessions disable row level security;
alter table public.cards          disable row level security;
alter table public.actions        disable row level security;

-- ---------------------------------------------
-- Realtime publication — tabloları realtime'a ekle
-- ---------------------------------------------
alter publication supabase_realtime add table public.retro_sessions;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.actions;
alter publication supabase_realtime add table public.users;

-- ---------------------------------------------
-- Faydalı index'ler (perf için)
-- ---------------------------------------------
create index idx_cards_session_id    on public.cards(session_id);
create index idx_cards_category      on public.cards(category);
create index idx_actions_card_id     on public.actions(card_id);
create index idx_actions_assigned_to on public.actions(assigned_to);

-- =============================================
-- DONE.
-- =============================================
```

---

## 🔍 Doğrulama Sorguları

Tabloları kurduktan sonra Supabase SQL Editor'da:

```sql
-- 4 tablo var mı?
select tablename from pg_tables where schemaname = 'public';

-- Admin user kuruldu mu?
select * from users where role = 'admin';

-- Realtime publication'a ekli mi?
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

Beklenen sonuç: 4 tablo + 1 admin satır + 4 tablo realtime publication'da.

---

## 🧪 Demo Verisi Seed (opsiyonel)

Eğer demo öncesi hızlı bir şey görmek istersen:

```sql
-- 1 örnek retro session
insert into retro_sessions (id, name, status, vote_limit, created_by)
values (
  '11111111-1111-1111-1111-111111111111',
  'Sprint 12 — Retroflow MVP',
  'voting',
  3,
  (select id from users where role = 'admin' limit 1)
);

-- Birkaç örnek kart
insert into cards (session_id, text, category, votes) values
  ('11111111-1111-1111-1111-111111111111', 'Daily standuplar çok uzun sürüyor', 'mad', 4),
  ('11111111-1111-1111-1111-111111111111', 'Code review hızlı oluyor 🎉',       'glad', 5),
  ('11111111-1111-1111-1111-111111111111', 'QA aşaması netleşmedi',             'sad', 2),
  ('11111111-1111-1111-1111-111111111111', 'CI/CD pipeline ekledik',            'glad', 6);
```

> **Not:** Demo'da gerçek interaksiyon daha etkileyici görünür. Seed verisini sadece testing için kullan.

---

## ⚠️ Production İçin Notlar (Demo Sonrası)

Bu DB tasarımı **hackathon hızı içindir**. Production'a almadan önce:

1. **RLS açılmalı**, her tablo için policy yazılmalı:
   - `users`: kendi satırını görür/günceller
   - `cards`: oturumdaki herkesi görür, sadece kendi insert eder
   - `actions`: ekip üyesi görür, sadece SM/Admin yazar
2. **Auth eklenmeli**: Supabase Auth (email + magic link)
3. **Atomic vote increment**: Şu an `update set votes = votes + 1` race-condition'a açık. Production'da Postgres function (RPC) ile atomicity sağlanmalı.
4. **`user_votes` tablosu**: Kim hangi karta oy verdi takibi için. MVP'de localStorage yetiyor.
5. **Session expiration**: 24 saat sonra `finished` auto-set.
6. **Audit log**: Kim aşama değiştirdi, kim oy verdi.

Bunların hepsi ScratchPad değil — production için **gerekli**.

---

## 🔗 Bağlantı Detayları

Frontend'den bu DB'ye erişim:

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Environment variables (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://<proje-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

> ⚠️ **`SERVICE_ROLE_KEY` ASLA frontend'de kullanılmaz.** Hackathonda sadece `ANON_KEY` yeterli.
