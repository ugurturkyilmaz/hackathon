---
name: nextjs-app-router
description: Use this skill when working with Next.js 14+ App Router patterns including page.tsx files, layouts, dynamic routes ([param]), Server vs Client Components, useRouter/useParams hooks, redirects, and metadata. Trigger this whenever the developer creates new pages, sets up routing, decides between server/client components, or implements navigation logic in the hackathon Retroflow project.
---

# Next.js App Router Skill

Reusable skill for building pages with Next.js 14+ App Router. Focuses on **page structure, Server/Client component decisions, dynamic routing, and navigation**.

## When to Use

- Creating a new page
- Setting up a layout
- Implementing dynamic routes (`[param]`)
- Deciding Server vs Client component
- Adding programmatic navigation
- Setting metadata (title, description)

## When NOT to Use

- Pages Router (eski mimari, biz App Router kullanıyoruz)
- Server Actions (hackathonda Supabase client-side yetiyor)
- Middleware (auth yok, gerek yok)

---

## 🏗️ Klasör Konvansiyonu

```
src/app/
├── layout.tsx              ← Root layout (server)
├── page.tsx                ← / route
├── globals.css             ← Tailwind directives
│
├── retro/
│   ├── page.tsx            ← /retro
│   ├── new/
│   │   └── page.tsx        ← /retro/new
│   └── [sessionId]/
│       └── page.tsx        ← /retro/abc-123
│
├── dashboard/
│   └── page.tsx            ← /dashboard
│
└── admin/
    └── page.tsx            ← /admin
```

**Dosya isimleri özel:** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.

---

## 🔀 Server vs Client Component Decision

### Karar ağacı

```
Bileşen interaktif mi? (onClick, state, effect)
├─ HAYIR → Server Component (default, hiçbir directive yazma)
└─ EVET  → Client Component ('use client' en üstte)
```

### Pratik kurallar

| Durum | Tipi |
|---|---|
| Sadece `<div>`, prop alıyor, render ediyor | Server |
| `useState` / `useEffect` var | Client (`'use client'`) |
| Form, click handler | Client |
| Supabase realtime subscription | Client |
| Sadece sunucu tarafı veri çekme | Server (`async function`) |
| Layout, sadece children render | Server |

### Örnek: Root Layout (Server)

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Retroflow — Retrospektif Platformu',
  description: 'Ekiplerin retro toplantılarını dijital olarak yönettiği platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
```

### Örnek: Login Page (Client)

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('member')

  const handleSubmit = () => {
    if (!name.trim()) return
    localStorage.setItem('currentUser', JSON.stringify({ name, role }))
    // Rol bazlı redirect
    if (role === 'admin') router.push('/admin')
    else if (role === 'manager') router.push('/dashboard')
    else router.push('/retro')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6">Retroflow'a Hoş Geldin</h1>
        {/* form */}
      </div>
    </main>
  )
}
```

---

## 🔗 Dynamic Routes

### Tanımlama

`[sessionId]/page.tsx` → URL: `/retro/abc-123`

### Page'de okuma

```tsx
'use client'

import { useParams } from 'next/navigation'

export default function RetroSessionPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId

  return <div>Session: {sessionId}</div>
}
```

> ⚠️ Server component'te param farklı şekilde gelir: `export default function Page({ params }: { params: { sessionId: string } })`. Client component'te `useParams()`.

---

## 🧭 Programmatic Navigation

```tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function MyComponent() {
  const router = useRouter()

  return (
    <>
      <button onClick={() => router.push('/retro')}>Retro'lara Git</button>
      <button onClick={() => router.replace('/login')}>Login'e (geri tuşu yok)</button>
      <button onClick={() => router.back()}>Geri</button>
      <button onClick={() => router.refresh()}>Sayfayı yenile</button>
    </>
  )
}
```

| Method | Davranış |
|---|---|
| `push(url)` | Yeni sayfaya git, history'e ekle |
| `replace(url)` | Yeni sayfaya git, history'i değiştirme (geri tuşu önceki sayfaya gider) |
| `back()` | Geri |
| `refresh()` | Sayfayı yeniden render |

---

## 🔄 Loading ve Error UI

### Loading

Aynı klasörde `loading.tsx`:

```tsx
// src/app/retro/[sessionId]/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Retro yükleniyor...</div>
    </div>
  )
}
```

> Hackathonda **inline loading state** daha esnek (hook'tan `loading: boolean` döner). Bu dosya opsiyonel.

### Error Boundary

```tsx
// src/app/retro/[sessionId]/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-red-600">Bir şeyler ters gitti</h2>
      <p className="mt-2 text-gray-700">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">
        Tekrar Dene
      </button>
    </div>
  )
}
```

---

## 🗺️ Metadata API

Server component'lerde:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Retro Board | Retroflow',
  description: 'Aktif retrospektif oturumu',
}
```

Dynamic metadata (path'ten):

```tsx
export async function generateMetadata({ params }: { params: { sessionId: string } }): Promise<Metadata> {
  return {
    title: `Retro ${params.sessionId} | Retroflow`,
  }
}
```

> Client component'te metadata export edilemez. Eğer dinamik title gerekiyorsa client'ta `document.title` ile setle (sadece SEO için değil, tarayıcı tab'ı için).

---

## 🎨 Layout Hiyerarşisi

```
RootLayout (app/layout.tsx)
  └── HomePage (app/page.tsx)
  └── RetroLayout (app/retro/layout.tsx) — opsiyonel
      └── RetroListPage (app/retro/page.tsx)
      └── NewRetroPage (app/retro/new/page.tsx)
      └── SessionPage (app/retro/[sessionId]/page.tsx)
```

Eğer `/retro/*` altındaki tüm sayfalar bir header paylaşıyorsa, `app/retro/layout.tsx` ekle:

```tsx
import { Header } from '@/components/layout/Header'

export default function RetroLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
```

> Hackathonda layout'ları minimal tut, her sayfada `<Header />` tekrarlamak da kabul.

---

## 🚫 Sık Yapılan Hatalar

### 1. Server component'te `useState`

```tsx
// ❌ Hata: useState is not defined
export default function Page() {
  const [x, setX] = useState(0)
}
```

→ Çözüm: dosyanın en üstüne `'use client'` ekle.

### 2. Client component'te `metadata` export

```tsx
// ❌ Hata
'use client'
export const metadata = { ... }
```

→ Metadata sadece Server component'lerde. Page'i Server tutup interaktif kısmı ayrı bir Client component'e taşı.

### 3. localStorage'a SSR'da erişim

```tsx
// ❌ Hata: localStorage is not defined
const user = JSON.parse(localStorage.getItem('user')!)
```

→ `useEffect` içinde oku, başlangıçta `null` state.

```tsx
const [user, setUser] = useState<User | null>(null)

useEffect(() => {
  const stored = localStorage.getItem('currentUser')
  if (stored) setUser(JSON.parse(stored))
}, [])
```

### 4. `next/navigation` vs `next/router`

App Router'da `next/navigation`. Pages Router'da `next/router`. **Karıştırma.**

---

## 📦 İlgili Skill'ler

- `role-based-access` — sayfa giriş kontrolü
- `realtime-subscriptions` — client component'te realtime
