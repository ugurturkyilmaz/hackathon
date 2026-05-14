---
name: role-based-access
description: Use this skill whenever the developer works on authentication, login flows, role selection, the useCurrentUser hook, localStorage user state, role-based redirects after login, conditional UI rendering based on user role (admin/scrum_master/member/manager), route protection without middleware, or showing/hiding buttons and pages depending on permissions. Trigger this skill for any task involving login pages, role checks, "kim ne görebilir" decisions, redirect logic after sign-in, or guarding /admin and /dashboard routes. Also trigger when fixing bugs like "manager kart yazabiliyor" or "scrum master butonu member'a görünüyor".
---

# Role-Based Access Skill

Retroflow'da gerçek bir auth sistemi yok (hackathon kısıtı). Bunun yerine **localStorage tabanlı basit bir rol seçim akışı** kullanılıyor. Bu skill, dört rolün (Admin, Scrum Master, Member, Manager) UI ve route düzeyinde nasıl ayrıştırıldığını anlatır.

## Ne Zaman Kullan

- `/login` sayfasını yazarken
- `useCurrentUser` hook'unu yazarken / değiştirirken
- Bir komponentin role göre conditional render yapması gerektiğinde
- `/admin` veya `/dashboard` route'larını korumaya alırken
- "Bu butonu kim görmeli?" sorusunu cevaplarken
- Login sonrası nereye yönlendirileceğini belirlerken

## Ne Zaman KULLANMA

- Realtime subscription veya postgres_changes → `realtime-subscriptions` skill
- Retro phase mantığı veya oy verme → `retro-flow-logic` skill
- DB tablosu veya SQL → `supabase-setup` skill

## Rol Matrisi

Hangi rolün neyi görebileceği tek bir referans tablosu:

| Aksiyon | Admin | Scrum Master | Member | Manager |
|---|---|---|---|---|
| `/login` sonrası yönlendirme | `/admin` | `/retro` | `/retro` | `/dashboard` |
| Kullanıcı ekleme / rol atama | ✅ | ❌ | ❌ | ❌ |
| Retro oturum oluşturma | ✅ | ✅ | ❌ | ❌ |
| Faz değiştirme (writing→voting→finished) | ❌ | ✅ | ❌ | ❌ |
| Kart yazma | ❌ | ✅ | ✅ | ❌ |
| Oy verme | ❌ | ✅ | ✅ | ❌ |
| Aksiyon oluşturma | ✅ | ✅ | ❌ | ❌ |
| Tüm aksiyonları listeleme (read-only) | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` (executive view) | ✅ | ❌ | ❌ | ✅ |

Bu matris **kod yazarken yanında açık olmalı**. Her conditional render'da bu tabloya bakılır.

## Veri Modeli (Hatırlatma)

`users` tablosundaki `role` kolonu sadece şu değerleri alır:

```ts
type UserRole = 'admin' | 'scrum_master' | 'member' | 'manager';
```

`localStorage` anahtarı: `retroflow_user` — değer JSON string:

```json
{ "id": "uuid-buraya", "name": "Uğur Türkyılmaz", "role": "admin" }
```

## Adım 1: useCurrentUser Hook

`src/lib/hooks/useCurrentUser.ts`:

```ts
'use client';

import { useEffect, useState } from 'react';

export type UserRole = 'admin' | 'scrum_master' | 'member' | 'manager';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
}

const STORAGE_KEY = 'retroflow_user';

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // bozuk JSON varsa temizle
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = (u: CurrentUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return { user, loading, signIn, signOut };
}
```

**Önemli:** `loading` state şart. Server render sırasında `localStorage` yok; ilk render'da `null` döner. `loading: true` iken redirect/UI gösterme.

## Adım 2: Login Sayfası

`src/app/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useCurrentUser, type UserRole } from '@/lib/hooks/useCurrentUser';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'scrum_master', label: 'Scrum Master' },
  { value: 'member', label: 'Ekip Üyesi' },
  { value: 'manager', label: 'Yönetici (Read-Only)' },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useCurrentUser();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('İsim boş olamaz');
      return;
    }
    setLoading(true);
    setError(null);

    // 1) Aynı isimde kullanıcı var mı kontrol et (basit demo)
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('name', name.trim())
      .maybeSingle();

    let user = existing;

    // 2) Yoksa oluştur
    if (!user) {
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({ name: name.trim(), role })
        .select()
        .single();

      if (insertError) {
        setError('Kullanıcı oluşturulamadı: ' + insertError.message);
        setLoading(false);
        return;
      }
      user = data;
    }

    // 3) localStorage'a yaz
    signIn({ id: user.id, name: user.name, role: user.role });

    // 4) Role göre redirect
    redirectByRole(user.role);
  };

  const redirectByRole = (r: UserRole) => {
    switch (r) {
      case 'admin':
        router.push('/admin');
        break;
      case 'manager':
        router.push('/dashboard');
        break;
      case 'scrum_master':
      case 'member':
        router.push('/retro');
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Retroflow</h1>
        <p className="text-sm text-gray-500 text-center">İsmini gir, rolünü seç.</p>

        <input
          type="text"
          placeholder="Adın Soyadın"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full border rounded px-3 py-2 bg-white"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded py-2 font-medium"
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </div>
    </div>
  );
}
```

## Adım 3: Route Koruma (Middleware Yok)

Next.js middleware kullanmıyoruz çünkü `localStorage` server'da yok. Bunun yerine **client-side guard component** yazıyoruz.

`src/components/RoleGuard.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser, type UserRole } from '@/lib/hooks/useCurrentUser';

interface Props {
  allow: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allow, children }: Props) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!allow.includes(user.role)) {
      // Yetkisiz → kendi alanına yolla
      switch (user.role) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'manager':
          router.replace('/dashboard');
          break;
        default:
          router.replace('/retro');
      }
    }
  }, [user, loading, allow, router]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
  }
  if (!user || !allow.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
```

Kullanım:

```tsx
// src/app/admin/page.tsx
'use client';

import { RoleGuard } from '@/components/RoleGuard';

export default function AdminPage() {
  return (
    <RoleGuard allow={['admin']}>
      <AdminDashboard />
    </RoleGuard>
  );
}
```

```tsx
// src/app/dashboard/page.tsx
<RoleGuard allow={['admin', 'manager']}>
  <ExecutiveDashboard />
</RoleGuard>
```

```tsx
// src/app/retro/page.tsx
<RoleGuard allow={['scrum_master', 'member']}>
  <RetroBoard />
</RoleGuard>
```

## Adım 4: UI İçinde Role-Based Render

Tek satır yardımcı yerine doğrudan role kontrolü daha okunabilir:

```tsx
const { user } = useCurrentUser();
const isScrumMaster = user?.role === 'scrum_master';
const canCreateAction = user?.role === 'scrum_master' || user?.role === 'admin';

return (
  <div>
    {isScrumMaster && <PhaseControl sessionId={sessionId} />}
    {canCreateAction && <button onClick={openActionModal}>Aksiyon Ekle</button>}
  </div>
);
```

**Anti-pattern:** UI'da role kontrolünü unutma + butonu disabled yapma. Demo'da yöneticinin "Aksiyon Ekle" butonunu görmesi kafa karıştırır → ya **tamamen gizle** ya da disabled+tooltip ile sebebini söyle.

## Adım 5: Logout Butonu

Header'da basit bir çıkış:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export function Header() {
  const { user, signOut } = useCurrentUser();
  const router = useRouter();

  if (!user) return null;

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-white">
      <div className="font-bold">Retroflow</div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">{user.name} · {user.role}</span>
        <button
          onClick={() => {
            signOut();
            router.replace('/login');
          }}
          className="text-red-600 hover:underline"
        >
          Çıkış
        </button>
      </div>
    </header>
  );
}
```

## Yaygın Hatalar

| Hata | Sebep | Çözüm |
|---|---|---|
| Sayfa flash'lıyor, login'e atıyor sonra geri geliyor | `loading` state'i kontrol etmeden redirect | `if (loading) return;` ekle |
| `localStorage is not defined` SSR hatası | Server component'te kullanım | `'use client'` ekle veya `useEffect` içine al |
| Manager kart yazabiliyor | UI kontrolü unutulmuş | `RoleGuard` + komponent içi role check |
| Login sonrası `/retro`'ya gidiyor ama oturum yok | Retro otomatik oluşturulmuyor | Boşsa "Oturum yok" placeholder göster, SM için "Yeni Oturum Aç" butonu |
| Birden fazla tab'da farklı kullanıcı | localStorage tab-bazlı değil, domain-bazlı | Demo'da incognito + normal kullan |
| `router.push` sonrası geri tuşuna basınca login'e dönüyor | `push` history'ye ekliyor | `router.replace` kullan |

## Demo Senaryosu (5 Dakika)

1. **Tab 1 → Admin** olarak gir → `/admin` açılır → users listesi
2. **Tab 2 (incognito) → Scrum Master** → `/retro` → yeni oturum aç, faz "writing"
3. **Tab 3 → Member** → `/retro` → mad/glad/sad kart ekler
4. Tab 2 (SM) → "Oylamaya Geç" → Tab 3'te kart input'u kaybolur, oy butonu çıkar
5. Tab 3 oy verir, sınıra ulaşınca buton disabled
6. SM "Bitir" → SM aksiyon ekler
7. **Tab 4 → Manager** → `/dashboard` → tüm aksiyonlar read-only listede

## İlgili Skill'ler

- `supabase-setup` — `users` tablosu ve insert query
- `nextjs-app-router` — `'use client'`, `useRouter`, dynamic routes
- `retro-flow-logic` — faz geçişlerinde role kontrolleri
- `realtime-subscriptions` — admin'in canlı user listesini görmesi
