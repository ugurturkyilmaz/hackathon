# 🗄️ DB Agent

## Rol Tanımı

Sen **DB Agent**'sın. Retroflow projesinin **Supabase tarafındaki şema, replication ayarları, RLS politikaları ve veri tabanı performansından sorumlusun**. SQL yazarsın, Supabase Dashboard üzerinden config yaparsın.

> ℹ️ Bu rol genelde Backend Agent ile çakışır. Hackathon ekibinde 1 kişi her ikisini de üstlenebilir. Ayrı tutmamızın sebebi: SQL ve schema, JS hook'larından bağımsız bir uzmanlık alanı.

## Görev Kapsamı

### Sorumlu olduğun şeyler

- **CREATE TABLE script'leri** — `04-DATABASE.md`'de yazılı
- **CHECK constraint'ler** (status, role, category enumlanması)
- **Foreign key relationships** — ON DELETE davranışı
- **Replication setup** — `supabase_realtime` publication'a tablo ekleme
- **Index oluşturma** — sık sorgulanan kolonlar için
- **Seed data** — admin user + demo verisi
- **Migration** — şema değişikliği gerektiğinde

### Sorumlu OLMADIĞIN şeyler

- ❌ Hook yazımı (Backend Agent)
- ❌ UI (Frontend Agent)
- ❌ Deploy (DevOps Agent)

## Çıktı Beklentisi

DB Agent'ın teslim ettiği şey:

1. **Bir SQL block** — Supabase SQL Editor'a yapıştırılıp tek tıkla çalıştırılabilir
2. **Doğrulama sorguları** — "Kurulum başarılı mı?" check'leri
3. **Realtime publication adımları** — manuel yapılacak Dashboard işlemleri

Tümü `docs/04-DATABASE.md` içinde mevcut. Yeni değişiklik gerekirse:
- Migration SQL'i hazırla
- `04-DATABASE.md`'ye not düş

## Şema Tasarım Kuralları

### Naming Convention

- **Tablolar:** `snake_case` ve **çoğul** (`users`, `retro_sessions`, `cards`, `actions`)
- **Kolonlar:** `snake_case` (`created_at`, `session_id`, `vote_limit`)
- **PK:** Her tablo `id uuid primary key default uuid_generate_v4()`
- **FK:** `<tablename_singular>_id` (örn: `session_id`, `card_id`, `user_id`)
- **Timestamp:** Her tabloda `created_at timestamptz not null default now()`

### Enum Yaklaşımı

Postgres'in `ENUM` tipini KULLANMA. Bunun yerine `CHECK constraint`:

```sql
role text not null check (role in ('admin', 'scrum_master', 'member', 'manager'))
```

**Neden?** Enum eklemek/çıkarmak migration gerektirir; check constraint esnek.

### ON DELETE Davranışı

| FK | Davranış | Neden? |
|---|---|---|
| `retro_sessions.created_by` → `users.id` | `set null` | User silinirse session korunsun, "deleted user" göster |
| `cards.session_id` → `retro_sessions.id` | `cascade` | Session silinince kartlar da gitsin |
| `cards.user_id` → `users.id` | `set null` | Anonim göster |
| `actions.card_id` → `cards.id` | `cascade` | Kart silinince aksiyon anlamsız |
| `actions.assigned_to` → `users.id` | `set null` | Kişi silinse de aksiyon kalır |

## Realtime Publication

Her tablo için Dashboard adımı:

```
Supabase Dashboard
└── Database
    └── Replication
        └── supabase_realtime publication
            ├── ☑ users
            ├── ☑ retro_sessions
            ├── ☑ cards
            └── ☑ actions
```

Veya SQL ile:

```sql
alter publication supabase_realtime add table public.retro_sessions;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.actions;
alter publication supabase_realtime add table public.users;
```

**Test:** Supabase Dashboard → Realtime → Inspector açık iken bir kart insert et, event akmalı.

## RLS Stratejisi (Hackathon)

| Tablo | RLS |
|---|---|
| `users` | KAPALI |
| `retro_sessions` | KAPALI |
| `cards` | KAPALI |
| `actions` | KAPALI |

`alter table public.X disable row level security;`

> Bu **demo kararı**. Production'da kesinlikle açılmalı. Production RLS örnekleri `04-DATABASE.md`'nin sonunda not olarak duruyor.

## Index Kuralları

Index ekledigin kolon:
- WHERE clausunda sık kullanılıyor mu? ✅
- JOIN'de kullanılıyor mu? ✅
- ORDER BY'da kullanılıyor mu? ✅

Şu an eklenenler:
```sql
create index idx_cards_session_id    on cards(session_id);
create index idx_cards_category      on cards(category);
create index idx_actions_card_id     on actions(card_id);
create index idx_actions_assigned_to on actions(assigned_to);
```

`votes` kolonuna index gerekmiyor (sıralamayı client yapıyor, az kart var).

## Olası Şema Değişiklikleri (Buffer)

Eğer Faz 4 sonunda zaman varsa eklenebilir:

### `user_votes` tablosu (kim kime oy verdi)

```sql
create table public.user_votes (
  user_id    uuid references users(id) on delete cascade,
  card_id    uuid references cards(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, card_id)
);
```

Yetkisi: Frontend, oy verirken hem `cards.votes`'u artırır hem de bu tabloya yazar. Limit kontrolü artık DB'den geliyor.

### `session_participants` tablosu

```sql
create table public.session_participants (
  session_id uuid references retro_sessions(id) on delete cascade,
  user_id    uuid references users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (session_id, user_id)
);
```

"Bu retro'da kimler var" görünürlüğü için. Hackathon'da SHIP DEĞIL.

## Debug Sorguları

```sql
-- Toplam kayıt sayıları
select 'users' as t, count(*) from users
union all select 'sessions', count(*) from retro_sessions
union all select 'cards', count(*) from cards
union all select 'actions', count(*) from actions;

-- Aktif session'lardaki en çok oylu kartlar
select s.name, c.text, c.category, c.votes
from cards c
join retro_sessions s on c.session_id = s.id
where s.status in ('voting', 'finished')
order by c.votes desc
limit 10;

-- Sahipsiz aksiyonlar
select a.description, a.deadline, c.text as card_text
from actions a
join cards c on a.card_id = c.id
where a.assigned_to is null;

-- Yaklaşan deadline'lar (önümüzdeki 7 gün)
select a.description, a.deadline, u.name as owner
from actions a
left join users u on a.assigned_to = u.id
where a.status = 'open'
  and a.deadline between now() and now() + interval '7 days'
order by a.deadline;
```

## Performans Notları (gerekirse)

- Supabase free tier: 500 MB DB, 5 GB egress
- Hackathon trafiği: ihmal edilebilir (<1MB)
- Realtime: 200 concurrent connection limiti — demo'da 5-6 sekme, sorun yok

## Backup ve Reset

Demo öncesi DB'yi temizlemek istersen:

```sql
truncate actions, cards, retro_sessions, users restart identity cascade;

-- Sonra admin user'ı tekrar ekle
insert into users (name, role) values ('Uğur Türkyılmaz', 'admin');
```

`truncate ... cascade` → tüm FK'lere bağlı satırları temizler. `restart identity` → auto-increment varsa sıfırlar (UUID kullandığımız için aslında etkisiz, alışkanlık).
