---
name: realtime-subscriptions
description: Use this skill whenever the developer works with Supabase Realtime, postgres_changes events, supabase.channel() subscriptions, INSERT/UPDATE/DELETE event listeners, realtime filters (e.g. session_id=eq.X), useEffect cleanup with removeChannel, or live-updating UI that reflects DB changes without manual refresh. Trigger this skill for any task involving live card lists, live vote counts, live session status updates, multi-tab demo scenarios, or debugging "değişiklik DB'de var ama UI'da görünmüyor", "çift kart görünüyor", "subscription leak" type bugs. Also trigger when wiring up the RetroBoard live updates, the admin's live user list, or the manager's live actions dashboard.
---

# Realtime Subscriptions Skill

Retroflow demo'sunun **"vay"** anı: Scrum Master fazı değiştirdiğinde tüm tab'larda anında yansıması. Bu skill, Supabase Realtime'ın `postgres_changes` API'ını React hook'ları içinde **doğru biçimde** kullanmanı sağlar — özellikle subscription leak, çift event, stale closure tuzaklarından kaçınarak.

## Ne Zaman Kullan

- `useCards`, `useRetroSession`, `useActions` hook'larını yazarken
- Yeni kart eklendiğinde diğer tab'da görünmesi gerektiğinde
- Oy sayacının canlı güncellenmesi gerektiğinde
- Faz değişikliğinin tüm kullanıcılara yayılması gerektiğinde
- Admin sayfasında yeni kullanıcı kaydının canlı görünmesi gerektiğinde
- "DB'de var, UI'da yok" tipi bug'ları debug ederken

## Ne Zaman KULLANMA

- Tek seferlik fetch yeterliyse → sadece `.select()` kullan, channel açma
- Auth / role logic → `role-based-access` skill
- Karmaşık business logic → `retro-flow-logic` skill

## Önkoşul: Tablonun Realtime'a Açık Olması

Supabase Dashboard → Database → Replication → `supabase_realtime` publication'a tablo eklenmiş olmalı. SQL ile:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE cards, retro_sessions, actions, users;
```

Bu zaten `docs/04-DATABASE.md` script'inde var. **Açık değilse hiçbir event gelmez.**

## Temel Pattern: useEffect İçinde Channel

```tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Card {
  id: string;
  session_id: string;
  text: string;
  category: 'mad' | 'glad' | 'sad';
  votes: number;
  user_id: string | null;
  created_at: string;
}

export function useCards(sessionId: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setCards([]);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    // 1) İlk fetch
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (cancelled) return;
      if (!error && data) setCards(data);
      setLoading(false);
    })();

    // 2) Realtime channel
    channel = supabase
      .channel(`cards:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cards',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newCard = payload.new as Card;
          setCards((prev) => {
            // Aynı id varsa eklenme (optimistic update collision)
            if (prev.some((c) => c.id === newCard.id)) return prev;
            return [...prev, newCard];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cards',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as Card;
          setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'cards',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const oldId = (payload.old as { id: string }).id;
          setCards((prev) => prev.filter((c) => c.id !== oldId));
        }
      )
      .subscribe();

    // 3) Cleanup — KRİTİK
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { cards, loading };
}
```

## Kritik Kurallar

### Kural 1: Her useEffect İçin Tek Channel

Aynı component birden fazla channel açmamalı. Eğer hem INSERT hem UPDATE dinleyeceksen aynı `.channel()` üzerine zincirle `.on()` çağrıları yap:

```ts
// ✅ DOĞRU
const channel = supabase
  .channel(`cards:${sessionId}`)
  .on('postgres_changes', { event: 'INSERT', ... }, handleInsert)
  .on('postgres_changes', { event: 'UPDATE', ... }, handleUpdate)
  .subscribe();

// ❌ YANLIŞ — iki ayrı channel açıyor, biri açık kalabilir
const ch1 = supabase.channel('a').on(...).subscribe();
const ch2 = supabase.channel('b').on(...).subscribe();
```

### Kural 2: Cleanup Şart

Component unmount olduğunda `removeChannel` çağrılmazsa:
- WebSocket bağlantısı açık kalır
- Sayfa değişiminde event gelmeye devam eder
- Multi-tab demo'da event'ler katlanır

```ts
return () => {
  if (channel) supabase.removeChannel(channel);
};
```

### Kural 3: Channel İsimleri Unique

`supabase.channel('cards')` herkeste aynı isim → conflict. Filter'a göre unique yap:

```ts
.channel(`cards:${sessionId}`)
.channel(`session:${sessionId}`)
.channel(`actions:${sessionId}`)
```

### Kural 4: Stale Closure Tuzağı

Setter fonksiyon callback formunu kullan, aksi halde eski state'i okur:

```ts
// ✅ DOĞRU — her zaman güncel state
setCards((prev) => [...prev, newCard]);

// ❌ YANLIŞ — closure içindeki cards stale olabilir
setCards([...cards, newCard]);
```

### Kural 5: Optimistic Update + Realtime Çakışması

Kart eklediğinde:
1. UI hemen güncellenir (optimistic)
2. DB insert döner
3. Realtime INSERT event'i de gelir → çift kart

**Çözüm A — Sadece realtime'a güven:**
```ts
const addCard = async (text: string, category: Category) => {
  await supabase.from('cards').insert({ session_id, text, category, user_id });
  // setCards çağırma — realtime INSERT halledecek
};
```

**Çözüm B — id ile dedupe:**
```ts
setCards((prev) => {
  if (prev.some((c) => c.id === newCard.id)) return prev;
  return [...prev, newCard];
});
```

Hackathon için **Çözüm A** daha basit ve güvenilir.

## useRetroSession Hook (Faz Değişikliği)

Aktif oturumun status'ünü canlı dinleme:

```ts
export function useRetroSession(sessionId: string | null) {
  const [session, setSession] = useState<RetroSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    (async () => {
      const { data } = await supabase
        .from('retro_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (!cancelled && data) setSession(data);
      setLoading(false);
    })();

    channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'retro_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new as RetroSession);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, loading };
}
```

## Filter Söz Dizimi

`postgres_changes` filter'ları PostgREST formatında:

| Amaç | Filter |
|---|---|
| Belirli session'ın kartları | `session_id=eq.${sessionId}` |
| Belirli kart'ın aksiyonları | `card_id=eq.${cardId}` |
| Belirli kişiye atanmış aksiyonlar | `assigned_to=eq.${userId}` |
| Sadece bir rolün kullanıcıları | `role=eq.manager` |
| Tüm kayıtlar (filter yok) | filter alanını koyma |

**Önemli:** Filter sadece **eq** (eşittir) destekler `postgres_changes` için. `in`, `gt`, `like` çalışmaz. Birden çok filter gerekiyorsa, callback içinde manuel filtrele.

## Multi-Subscription Aynı Sayfada

RetroBoard hem `cards` hem `session` dinleyebilir → ayrı hook'lar, ayrı channel'lar:

```tsx
function RetroBoard({ sessionId }: { sessionId: string }) {
  const { session } = useRetroSession(sessionId);
  const { cards } = useCards(sessionId);

  return (
    <>
      <h1>Faz: {session?.status}</h1>
      <CardGrid cards={cards} />
    </>
  );
}
```

Her hook kendi channel'ını yönetir, kendi cleanup'ını yapar. Sorun çıkmaz.

## Debug: "Event Gelmiyor"

Sırasıyla kontrol et:

1. **Tablo publication'da mı?**
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
   Liste boşsa veya tablo yoksa publication'a ekle.

2. **Channel subscribe oldu mu?**
   ```ts
   .subscribe((status) => {
     console.log('channel status:', status);
   });
   ```
   `SUBSCRIBED` görmen lazım. `CHANNEL_ERROR` görüyorsan filter syntax'i yanlış olabilir.

3. **Browser DevTools → Network → WS sekmesi**
   `wss://...supabase.co/realtime/v1/websocket` bağlantısı açık mı? Mesajlar akıyor mu?

4. **Filter doğru mu?**
   ```ts
   filter: `session_id=eq.${sessionId}`
   ```
   `sessionId` `undefined` ise filter `session_id=eq.undefined` olur ve hiçbir event gelmez. `if (!sessionId) return;` koy.

5. **RLS kapalı mı?**
   RLS açıksa ve policy yoksa Realtime event görünmez. Hackathon'da RLS kapalı tutulduğu için bu sorun olmamalı, ama Supabase Dashboard'dan kontrol et.

## Debug: "Çift Kart Görünüyor"

- Optimistic update + realtime hem ekliyor → optimistic'i kaldır
- Component iki kez mount oluyor (React 18 strict mode) → cleanup doğru çalışıyor mu?
- Aynı sessionId için iki ayrı hook instance çalışıyor olabilir → React DevTools ile component ağacını incele

## Performans Notu

Bir kullanıcı için 3-4 channel limit. Daha fazlasında performans düşer ve Supabase free tier limit'ine takılabilirsin. Retroflow için 2-3 channel yeterli (cards + session + opsiyonel actions).

## Demo Sırasında

Hackathon demosunda **iki tab yan yana** aç:
- Tab 1: Scrum Master, kart ekleniyor
- Tab 2: Member, kart anında düşüyor

Bu görsel, juriye **"gerçekten canlı çalışıyor"** mesajını verir. Demo'dan önce **mutlaka iki tab'da test et**.

## İlgili Skill'ler

- `supabase-setup` — publication SQL, client singleton
- `nextjs-app-router` — `'use client'` zorunluluğu, hydration uyarıları
- `retro-flow-logic` — faz UPDATE event'i ile UI değişimi
- `role-based-access` — admin'in canlı user listesini görmesi
