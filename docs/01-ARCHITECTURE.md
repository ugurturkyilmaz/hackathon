# 🏗️ 01 — Mimari

## 🧱 Genel Bakış

```
┌────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Next.js App Router (TypeScript + Tailwind)              │ │
│  │  - Pages (Server Components varsayılan)                 │ │
│  │  - Client Components (interactive: 'use client')        │ │
│  │  - Supabase Browser Client (singleton)                  │ │
│  └────────────────────┬─────────────────────────────────────┘ │
└───────────────────────│────────────────────────────────────────┘
                        │ HTTPS + WebSocket (Realtime)
                        ▼
┌────────────────────────────────────────────────────────────────┐
│                     SUPABASE (Backend-as-a-Service)            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL  │  Realtime Channels  │  Auto-REST API     │ │
│  │   - users    │   (postgres_changes) │   (PostgREST)     │ │
│  │   - sessions │                       │                   │ │
│  │   - cards    │                       │                   │ │
│  │   - actions  │                       │                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Server tarafı kod yok.** Tüm logic Supabase + Next.js client tarafında. Hackathon hızı için bu seçim bilinçli.

---

## 📁 Next.js Klasör Yapısı

```
src/
├── app/
│   ├── layout.tsx                  ← Root layout (font, Tailwind)
│   ├── page.tsx                    ← Landing / login (isim + rol seçimi)
│   ├── globals.css                 ← Tailwind directives
│   │
│   ├── dashboard/
│   │   └── page.tsx                ← Yönetici read-only aksiyon listesi
│   │
│   ├── retro/
│   │   ├── page.tsx                ← Retro odaları listesi
│   │   ├── new/
│   │   │   └── page.tsx            ← Yeni oda oluştur (SM only)
│   │   └── [sessionId]/
│   │       └── page.tsx            ← Aktif retro board
│   │
│   └── admin/
│       └── page.tsx                ← Admin: kullanıcı rol atama
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── retro/
│   │   ├── RetroBoard.tsx          ← 3-kolonlu Mad/Glad/Sad
│   │   ├── CardColumn.tsx          ← Tek bir kolon (kategori)
│   │   ├── RetroCard.tsx           ← Tek kart (text, votes, vote button)
│   │   ├── PhaseControl.tsx        ← SM "Aşamayı Değiştir" kontrolü
│   │   └── ActionForm.tsx          ← Aksiyon oluşturma modal
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── RoleBadge.tsx
│   └── dashboard/
│       └── ActionsTable.tsx        ← Executive aksiyon listesi
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← Browser client (createClient)
│   │   └── types.ts                ← Database type'ları
│   ├── hooks/
│   │   ├── useCurrentUser.ts       ← localStorage'dan rol + isim
│   │   ├── useRetroSession.ts      ← Tek session fetch + realtime
│   │   └── useCards.ts             ← Kart CRUD + realtime
│   └── utils/
│       ├── cn.ts                   ← Tailwind class merge
│       └── constants.ts            ← Kategori renkleri, oy limiti vs.
│
└── types/
    └── index.ts                    ← Domain type'ları (User, Card, Action…)
```

**Neden bu yapı?**
- `app/` → Next.js 14 App Router convention
- `components/` → Domain'e göre gruplandı (retro, dashboard, ui)
- `lib/` → Pure logic + Supabase
- Server Component default; sadece interaktif olanlar `'use client'`

---

## 🔄 Veri Akışı — Senaryo Bazlı

### Senaryo 1: Kart Ekleme

```
[Üye] tıklar "Add Card"
   │
   ▼
[Client Component: RetroBoard] state'e ekler (optimistic)
   │
   ▼
[Supabase Client] INSERT into cards
   │
   ▼
[Supabase Postgres] insert + Realtime event broadcast
   │
   ▼
[Tüm bağlı clientlar] Realtime channel "cards:sessionId" dinler
   │
   ▼
[State update] Yeni kart tüm ekranlarda görünür
```

### Senaryo 2: Aşama Geçişi

```
[SM] tıklar "Oylamaya Geç"
   │
   ▼
[Supabase Client] UPDATE retro_sessions SET status='voting' WHERE id=...
   │
   ▼
[Realtime broadcast]
   │
   ▼
[Tüm clientlar] session.status='voting' aldı
   │
   ▼
[UI] Kart input alanları disabled, oy butonları visible
```

### Senaryo 3: Oy Verme

```
[Üye] tıklar 👍 butonuna
   │
   ▼
[Client] kişi başı oy limitini kontrol et (local state)
   │
   ▼
[Supabase] UPDATE cards SET votes = votes + 1 WHERE id=...
              + UPSERT user_votes(userId, cardId)
   │
   ▼
[Realtime] tüm clientlar yeni oy sayısını alır
```

---

## 🔐 Kimlik ve Rol Stratejisi

**Hackathon kararı: Auth yok, sadece localStorage.**

```typescript
// Login sayfasında:
localStorage.setItem('currentUser', JSON.stringify({
  id: uuid(),
  name: 'Ali',
  role: 'scrum_master'
}))
```

- Hiçbir gerçek authentication yok
- Supabase RLS kapalı, anon key her şeyi yapabilir
- **Bu sadece demo içindir**, production değil
- Her tarayıcı sekmesi farklı kullanıcı gibi davranır (kolay test)

### Rol Bazlı UI Görünürlüğü

| Sayfa | Admin | SM | Member | Manager |
|---|---|---|---|---|
| `/` (login) | ✅ | ✅ | ✅ | ✅ |
| `/retro` (liste) | ✅ | ✅ | ✅ | ✅ |
| `/retro/new` (oluştur) | ✅ | ✅ | ❌ | ❌ |
| `/retro/[id]` (board) | ✅ | ✅ (kontrol) | ✅ (yaz/oyla) | ✅ (read) |
| `/dashboard` (exec) | ✅ | ✅ | ❌ | ✅ |
| `/admin` (rol ata) | ✅ | ❌ | ❌ | ❌ |

Bu kontrolü her sayfa başında `useCurrentUser()` ile yapacağız, yetki yoksa redirect.

---

## 🔌 Realtime Strategy

Supabase Realtime kullanılacak:

```typescript
supabase
  .channel(`session:${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'cards',
    filter: `session_id=eq.${sessionId}`
  }, handleCardChange)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'retro_sessions',
    filter: `id=eq.${sessionId}`
  }, handleSessionChange)
  .subscribe()
```

**Önemli not:** Supabase Realtime'ı kullanmak için ilgili tablolarda Replication açılmalı. Bu adım `04-DATABASE.md` içinde detaylandırıldı.

---

## 🎨 UI Mimari Prensipleri

1. **Tailwind utility-first** — özel CSS yok
2. **Dark mode YOK** — hackathonda zaman kaybı
3. **3 ana renk paleti**:
   - Mad: `red-500` / `red-50` background
   - Glad: `green-500` / `green-50` background
   - Sad: `blue-500` / `blue-50` background
4. **Component yapısı**: Compound components değil, basit props (hız)
5. **Responsive**: `flex-col md:flex-row` pattern; mobile-first
6. **Loading**: Tüm async UI'da skeleton veya spinner
7. **Error**: Toast yerine inline error message (basitlik)

---

## 📦 Bağımlılık Mimarisi

```
package.json
├── next                (14.x — App Router)
├── react / react-dom   (18.x)
├── typescript          (5.x)
├── tailwindcss         (3.x)
├── @supabase/supabase-js  (2.x — single client)
├── uuid                (id generation)
└── (dev deps standard)
```

**Eklenmeyecekler** (zaman kaybı): zustand, redux, react-query, framer-motion, headless-ui, shadcn-init wizard, eslint config karmaşıklığı.

---

## ✋ "Yapmıyoruz" Listesi (Bilinçli atlanan mimari kararlar)

- ❌ Server Actions — Client-side Supabase yeterli
- ❌ Middleware auth — RLS de yok zaten
- ❌ API routes — Supabase REST yeterli
- ❌ Edge functions — gerek yok
- ❌ Image optimization (next/image kullanırız ama tuning yok)
- ❌ I18n — sadece TR/EN karışık, demo
- ❌ Test (unit/e2e) — demo odaklı
- ❌ Animasyon library — sadece Tailwind transitions

Bu kararların hepsinin nedeni: **3 saatte demo'su sağlam çalışan bir şey.**
