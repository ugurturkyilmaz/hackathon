---
name: supabase-setup
description: Use this skill whenever the developer needs to set up Supabase from scratch in a Next.js project — creating tables, configuring the JS client singleton, enabling Realtime publication, seeding initial data, or generating TypeScript types from the schema. Trigger this for any task involving Supabase configuration, schema migrations, or first-time backend wiring in a hackathon-grade Next.js app.
---

# Supabase Setup Skill

Reusable skill for setting up Supabase as a backend for a Next.js App Router project. Covers the 4 main tasks: **schema creation, client singleton, realtime enabling, and seed data**.

## When to Use

- Project just started, no DB tables yet
- Adding a new table or modifying schema
- Realtime not working — need to verify publication
- New developer onboarding to the project

## When NOT to Use

- Auth setup (out of scope for this hackathon — sıkı auth yok)
- RLS policy writing (kapalı, demo için)
- Edge functions (gerekmiyor)

---

## 🎯 Procedure

### Step 1 — Schema Creation

Open Supabase Dashboard → SQL Editor → "New query" → paste this:

```sql
create extension if not exists "uuid-ossp";

create table public.users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  role        text not null check (role in ('admin', 'scrum_master', 'member', 'manager')),
  created_at  timestamptz not null default now()
);

create table public.retro_sessions (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  status      text not null default 'writing' check (status in ('writing', 'voting', 'finished')),
  vote_limit  int not null default 3,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.cards (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references public.retro_sessions(id) on delete cascade,
  text        text not null,
  category    text not null check (category in ('mad', 'glad', 'sad')),
  votes       int not null default 0,
  user_id     uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.actions (
  id           uuid primary key default uuid_generate_v4(),
  card_id      uuid not null references public.cards(id) on delete cascade,
  assigned_to  uuid references public.users(id) on delete set null,
  description  text not null,
  status       text not null default 'open' check (status in ('open', 'done')),
  deadline     date,
  created_at   timestamptz not null default now()
);

create index idx_cards_session_id    on cards(session_id);
create index idx_cards_category      on cards(category);
create index idx_actions_card_id     on actions(card_id);
create index idx_actions_assigned_to on actions(assigned_to);
```

Click **Run**. Should see "Success. No rows returned" 4 times.

### Step 2 — Disable RLS (Hackathon Only)

```sql
alter table public.users          disable row level security;
alter table public.retro_sessions disable row level security;
alter table public.cards          disable row level security;
alter table public.actions        disable row level security;
```

⚠️ **Production'da YAPMA**, sadece hackathon için.

### Step 3 — Enable Realtime Publication

```sql
alter publication supabase_realtime add table public.retro_sessions;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.actions;
alter publication supabase_realtime add table public.users;
```

Doğrulama:
```sql
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

4 satır dönmeli.

### Step 4 — Seed Admin

```sql
insert into public.users (name, role)
values ('Uğur Türkyılmaz', 'admin');
```

(Adı kendi ismine değiştir.)

### Step 5 — Client Singleton

Create `src/lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Supabase env vars missing — check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 6 — Environment Variables

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://cinoypeobrrcudpsasld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

> ⚠️ Sondaki `/rest/v1/` yok. Sadece base URL.

`.env.example` (commit'lenir):
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 7 — TypeScript Types

`src/types/index.ts`:

```typescript
export type Role = 'admin' | 'scrum_master' | 'member' | 'manager'
export type Category = 'mad' | 'glad' | 'sad'
export type SessionStatus = 'writing' | 'voting' | 'finished'
export type ActionStatus = 'open' | 'done'

export interface User {
  id: string
  name: string
  role: Role
  created_at: string
}

export interface RetroSession {
  id: string
  name: string
  status: SessionStatus
  vote_limit: number
  created_by: string | null
  created_at: string
}

export interface Card {
  id: string
  session_id: string
  text: string
  category: Category
  votes: number
  user_id: string | null
  created_at: string
}

export interface Action {
  id: string
  card_id: string
  assigned_to: string | null
  description: string
  status: ActionStatus
  deadline: string | null
  created_at: string
}
```

---

## ✅ Verification Checklist

After running all steps:

- [ ] Supabase Dashboard → Table Editor: 4 tables visible
- [ ] `users` table has 1 admin row
- [ ] Database → Replication → 4 tables in `supabase_realtime`
- [ ] Browser console: `supabase.from('users').select('*')` returns admin
- [ ] No CORS errors

---

## 🐛 Common Errors

### "relation already exists"

Already ran the script. Either drop tables first or skip this step.

```sql
drop table if exists actions cascade;
drop table if exists cards cascade;
drop table if exists retro_sessions cascade;
drop table if exists users cascade;
```

### "permission denied for table users"

RLS açık ve policy yok. Step 2'yi yeniden çalıştır.

### Realtime event gelmiyor

- Tablo replication'da mı? Step 3 doğrulama.
- Client doğru filter mı kullanıyor? (`session_id=eq.${id}` formatı)
- Browser DevTools → Network → WS → Supabase websocket open mı?

---

## 📚 Sonraki Adım

DB setup bittikten sonra:

1. **`role-based-access` skill**'i — kullanıcı login + rol bazlı routing
2. **`retro-flow-logic` skill**'i — board + voting akışı
3. **`realtime-subscriptions` skill**'i — realtime hook pattern'i
