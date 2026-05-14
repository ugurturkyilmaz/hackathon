---
name: retro-flow-logic
description: Use this skill when implementing the core retrospective meeting flow in the Retroflow app — including the Mad/Glad/Sad card-writing UI, the writing→voting→finished phase transitions, vote counting with per-user limits, and converting top-voted cards into actions. Trigger this skill whenever the developer works on the RetroBoard component, phase control logic, voting mechanism, or action creation modal.
---

# Retro Flow Logic Skill

The heart of the app: how a retrospective session progresses from card-writing through voting to action assignment. Captures the **3-phase state machine**, **vote limits**, **action conversion**, and **UI conditional rendering**.

## When to Use

- Implementing the `RetroBoard` component
- Adding `PhaseControl` for Scrum Master
- Building voting logic with limits
- Creating the `ActionForm` modal
- Debugging "kart eklenebiliyor ama oy fazı kilitlenmiyor" gibi sorunlar

## When NOT to Use

- Pure auth / role logic → `role-based-access` skill
- Realtime subscription internals → `realtime-subscriptions` skill
- DB schema → `supabase-setup` skill

---

## 🎭 Phase State Machine

```
┌──────────┐   SM clicks       ┌──────────┐   SM clicks      ┌──────────┐
│ writing  │ ────────────────▶ │  voting  │ ───────────────▶ │ finished │
└──────────┘  "Oylamaya Geç"   └──────────┘  "Bitir"         └──────────┘
                                                                   ▲
                                          (Aksiyonlara Geç de buraya gelir)
```

| Status | Kart input | Oy butonu | Aksiyon ekle butonu | Kim kontrol eder? |
|---|---|---|---|---|
| `writing` | ✅ görünür | ❌ | ❌ | SM aşamayı değiştirir |
| `voting`  | ❌ | ✅ görünür (limit varsa) | ❌ | SM aşamayı değiştirir |
| `finished` | ❌ | ❌ | ✅ görünür (SM/Admin) | Read-only |

> Hackathon basitleştirmesi: "Aksiyonlara Geç" diye ayrı bir status yok. `finished`'a girince aksiyon eklenebilir.

---

## 🧱 Komponent Hiyerarşisi

```
SessionPage (app/retro/[sessionId]/page.tsx)
├── Header (kullanıcı + rol)
├── SessionInfo (isim, status badge, katılımcı sayısı)
├── PhaseControl (sadece SM/Admin görür)
└── RetroBoard
    ├── CardColumn (Mad)
    │   ├── ColumnHeader
    │   ├── CardList
    │   │   └── RetroCard (× N)
    │   └── AddCardInput (sadece writing)
    ├── CardColumn (Glad)
    └── CardColumn (Sad)
└── ActionForm modal (kart seçilince açılır, sadece finished)
```

---

## 💻 Phase Control Implementation

```tsx
'use client'

import { supabase } from '@/lib/supabase/client'
import type { RetroSession, SessionStatus } from '@/types'

interface Props {
  session: RetroSession
  userRole: string
}

const PHASE_LABEL: Record<SessionStatus, string> = {
  writing: 'Yazma Aşaması',
  voting: 'Oylama Aşaması',
  finished: 'Tamamlandı',
}

const NEXT_PHASE: Partial<Record<SessionStatus, { next: SessionStatus; label: string }>> = {
  writing: { next: 'voting', label: 'Oylamaya Geç' },
  voting:  { next: 'finished', label: 'Bitir' },
}

export function PhaseControl({ session, userRole }: Props) {
  // Sadece SM ve Admin görür
  if (userRole !== 'scrum_master' && userRole !== 'admin') return null

  const transition = NEXT_PHASE[session.status]

  const handleClick = async () => {
    if (!transition) return
    const confirmed = confirm(`${transition.label}? Bu işlem geri alınamaz.`)
    if (!confirmed) return
    const { error } = await supabase
      .from('retro_sessions')
      .update({ status: transition.next })
      .eq('id', session.id)
    if (error) alert(`Hata: ${error.message}`)
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
      <div className="flex-1">
        <div className="text-sm text-indigo-700">Mevcut Aşama</div>
        <div className="text-lg font-semibold text-indigo-900">
          {PHASE_LABEL[session.status]}
        </div>
      </div>
      {transition && (
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          {transition.label} →
        </button>
      )}
    </div>
  )
}
```

---

## 🎟️ Voting Logic with Per-User Limit

### Veri tutma stratejisi

DB'de `user_votes` tablosu YOK (hackathonda kestik). Yerine **localStorage**:

```typescript
// key: 'votes:<sessionId>'
// value: { [cardId]: count }
{
  "card-uuid-1": 1,
  "card-uuid-2": 2
}
```

### Vote hook ekstansiyonu

```typescript
// src/lib/hooks/useVoting.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useVoting(sessionId: string, voteLimit: number) {
  const [myVotes, setMyVotes] = useState<Record<string, number>>({})

  // localStorage'tan başlangıçta yükle
  useEffect(() => {
    const stored = localStorage.getItem(`votes:${sessionId}`)
    if (stored) setMyVotes(JSON.parse(stored))
  }, [sessionId])

  const totalVotesUsed = Object.values(myVotes).reduce((sum, n) => sum + n, 0)
  const remainingVotes = Math.max(0, voteLimit - totalVotesUsed)
  const canVote = remainingVotes > 0

  const castVote = async (cardId: string) => {
    if (!canVote) return

    // 1. DB'de votes +1
    const { data, error: fetchErr } = await supabase
      .from('cards')
      .select('votes')
      .eq('id', cardId)
      .single()
    if (fetchErr || !data) return

    const { error } = await supabase
      .from('cards')
      .update({ votes: data.votes + 1 })
      .eq('id', cardId)
    if (error) return

    // 2. Local state güncelle
    const updated = { ...myVotes, [cardId]: (myVotes[cardId] ?? 0) + 1 }
    setMyVotes(updated)
    localStorage.setItem(`votes:${sessionId}`, JSON.stringify(updated))
  }

  return { castVote, canVote, remainingVotes, myVotes }
}
```

### UI'da kullanım

```tsx
const { castVote, canVote, remainingVotes, myVotes } = useVoting(sessionId, session.vote_limit)

// ...
{session.status === 'voting' && (
  <div className="text-sm text-gray-600 mb-3">
    Kalan oyun: <strong>{remainingVotes}</strong> / {session.vote_limit}
  </div>
)}

<button
  onClick={() => castVote(card.id)}
  disabled={!canVote}
  className="..."
>
  👍 {card.votes}
  {myVotes[card.id] > 0 && (
    <span className="ml-1 text-xs">(senin: {myVotes[card.id]})</span>
  )}
</button>
```

> ⚠️ Limit refresh sonrası localStorage'tan geri yüklenir. Farklı tarayıcıdan girersen sıfırlanır (kabul: hackathon limit).

---

## ➕ Card Addition (Sadece Writing Aşamasında)

```tsx
'use client'

import { useState } from 'react'

interface Props {
  category: 'mad' | 'glad' | 'sad'
  onAdd: (text: string, category: 'mad'|'glad'|'sad') => Promise<void>
  enabled: boolean
}

const PLACEHOLDER: Record<string, string> = {
  mad:  'Beni rahatsız eden bir şey...',
  glad: 'Beni mutlu eden bir şey...',
  sad:  'Üzücü/kötü giden bir şey...',
}

export function AddCardInput({ category, onAdd, enabled }: Props) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!enabled) return null

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await onAdd(trimmed, category)
      setText('')
    } catch (e) {
      alert(`Hata: ${e}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
        }}
        placeholder={PLACEHOLDER[category]}
        rows={2}
        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting || !text.trim()}
        className="mt-2 w-full px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-lg text-sm font-medium"
      >
        {submitting ? 'Ekleniyor...' : '+ Kart Ekle'}
      </button>
    </div>
  )
}
```

---

## 🎯 Action Creation

```tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Card, User } from '@/types'

interface Props {
  card: Card
  members: User[]
  onClose: () => void
}

export function ActionForm({ card, members, onClose }: Props) {
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('actions').insert({
      card_id: card.id,
      assigned_to: assignedTo || null,
      description: description.trim(),
      deadline: deadline || null,
    })
    setSubmitting(false)
    if (error) {
      alert(`Hata: ${error.message}`)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-1">Aksiyon Ekle</h3>
        <p className="text-sm text-gray-600 mb-4">
          Kart: <em>"{card.text}"</em>
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Ne yapılacak?</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Örn: Daily'leri 15 dakikaya düşür"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Kim yapacak?</label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Seç --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ne zamana kadar?</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 Sıralama Davranışı

Voting + finished aşamasında kartlar oy sayısına göre sıralanır:

```typescript
const sortedCards = cards
  .filter(c => c.category === category)
  .sort((a, b) => {
    if (session.status === 'writing') {
      // Yazma aşamasında en yeni üstte (created_at desc)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    // Voting/finished: en çok oy üstte (votes desc)
    return b.votes - a.votes
  })
```

---

## 🐛 Debug Sorun-Çözüm

| Sorun | Çözüm |
|---|---|
| "Oylamaya Geç" tıkladıkça sayfa update olmuyor | `useRetroSession` realtime subscription'ı status değişikliğini yakalamıyor → channel filter'ı doğru mu? `id=eq.${sessionId}` |
| Kart ekledim, iki kez görünüyor | Optimistic update var ve realtime de geliyor → Optimistic'i kaldır, sadece realtime'a güven |
| Oy butonu disabled olmuyor | `localStorage` SSR'da yok, useEffect ile yükleniyor ama component daha önce render oldu → İlk render `loading={true}` döndür |
| Aksiyon eklendi ama dashboard'da yok | Manager rolünde olduğunu doğrula. Dashboard'un `actions` tablosunu çekme query'sini kontrol et |

---

## 📚 İlgili Skill'ler

- `realtime-subscriptions` — kart ve session realtime
- `role-based-access` — SM/Admin yetkilendirme
- `supabase-setup` — DB temel
