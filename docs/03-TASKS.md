# ✅ 03 — Task Breakdown

Her task: **5-15 dakika**lık, tek bir kişi tarafından bitirilebilir, açık çıktısı olan iş.

> Format: `[ID] Açıklama → çıktı → bağımlılık`

---

## 🟢 P0 — Setup (5 task)

| ID | Task | Süre | Çıktı | Bağımlılık |
|----|------|------|-------|-----------|
| **T0.1** | `npx create-next-app@latest hackathon-retro` (App Router, TS, Tailwind, src/) | 5 dk | Boş proje | — |
| **T0.2** | `npm i @supabase/supabase-js uuid` + `@types/uuid` | 2 dk | package.json güncel | T0.1 |
| **T0.3** | `.env.local` + `.env.example` yaz (URL + anon key placeholder) | 2 dk | env dosyaları hazır | T0.1 |
| **T0.4** | `src/lib/supabase/client.ts` — singleton `createClient()` export | 5 dk | Browser client kullanılabilir | T0.3 |
| **T0.5** | `git init`, `.gitignore`'da `.env.local` doğrula, GitHub repo'ya bağla, ilk push | 5 dk | Repo public/private | T0.1 |

---

## 🟢 P1 — DB ve Auth (6 task)

| ID | Task | Süre | Çıktı | Bağımlılık |
|----|------|------|-------|-----------|
| **T1.1** | Supabase SQL Editor: `04-DATABASE.md` içindeki CREATE TABLE'ları çalıştır | 5 dk | 4 tablo (users, retro_sessions, cards, actions) | T0 |
| **T1.2** | Initial admin user INSERT (kendi ismin) | 1 dk | users tablosunda admin satırı | T1.1 |
| **T1.3** | Supabase Database → Replication → tabloları realtime'a ekle | 3 dk | Realtime publication aktif | T1.1 |
| **T1.4** | `src/types/index.ts` — User, Role, RetroSession, Card, Action, ActionStatus tipleri | 10 dk | Tüm tipler dışa aktarıldı | T1.1 |
| **T1.5** | `src/lib/hooks/useCurrentUser.ts` — localStorage hook | 5 dk | `{user, setUser, clear}` döner | T1.4 |
| **T1.6** | `src/app/page.tsx` — Login UI: isim input + 4 rol button + "Devam" | 15 dk | Form çalışır, localStorage'a kaydeder, redirect yapar | T1.5 |

---

## 🟡 P2 — Retro Board UI (10 task)

| ID | Task | Süre | Çıktı | Bağımlılık |
|----|------|------|-------|-----------|
| **T2.1** | `src/components/layout/Header.tsx` — logo, kullanıcı adı, rol badge, logout | 10 dk | Tüm sayfalarda kullanılabilir | T1.5 |
| **T2.2** | `src/components/ui/Button.tsx` + `Input.tsx` + `Card.tsx` — temel UI kit | 10 dk | Yeniden kullanılabilir bileşenler | — |
| **T2.3** | `src/app/retro/page.tsx` — retro odaları listesi (status=writing/voting filtreli) | 10 dk | Liste sayfası | T1.4 |
| **T2.4** | `src/app/retro/new/page.tsx` — SM oda formu (isim, oy limit) | 10 dk | Form → INSERT → redirect /retro/[id] | T2.3 |
| **T2.5** | `src/app/retro/[sessionId]/page.tsx` — board sayfası iskeleti | 5 dk | Sayfa açılıyor, sessionId geliyor | T2.3 |
| **T2.6** | `src/lib/hooks/useRetroSession.ts` — tek session fetch + realtime | 15 dk | Session reaktif şekilde gelir | T1.4 |
| **T2.7** | `src/lib/hooks/useCards.ts` — kartlar fetch + insert + realtime | 15 dk | `{cards, addCard, voteCard, loading}` | T1.4 |
| **T2.8** | `src/components/retro/RetroBoard.tsx` — 3 kolonlu grid | 10 dk | 3 CardColumn yan yana | T2.7 |
| **T2.9** | `src/components/retro/CardColumn.tsx` — kategori bazlı liste + "+ Add" | 15 dk | Mad / Glad / Sad ayrı kolonlar | T2.8 |
| **T2.10** | `src/components/retro/RetroCard.tsx` — kart UI (text + vote count + vote btn) | 10 dk | Tek kart görseli | T2.9 |

---

## 🟡 P3 — Aşama Yönetimi + Oylama (8 task)

| ID | Task | Süre | Çıktı | Bağımlılık |
|----|------|------|-------|-----------|
| **T3.1** | `src/components/retro/PhaseControl.tsx` — SM görür, 3 buton (next phase) | 10 dk | Status değiştiren UI | T2.6 |
| **T3.2** | Session.status'a göre conditional render: writing/voting/finished | 10 dk | UI status'a tepki verir | T3.1 |
| **T3.3** | Writing status: input görünür, voting'de gizli | 5 dk | Kart eklenmesi sadece writing'de | T3.2 |
| **T3.4** | Voting status: oy butonu görünür, kart input gizli | 5 dk | Oy butonları aktif | T3.2 |
| **T3.5** | Local state: `votesUsedByMe` — limit aştığında disabled buton | 10 dk | Oy limiti enforce | T3.4 |
| **T3.6** | `useCards`'a `voteCard(id)` mutasyonu ekle (votes +=1) | 10 dk | Oy tıklayınca DB güncellenir | T2.7 |
| **T3.7** | Realtime: votes değişince diğer ekranlarda anında yansı | 5 dk | (T2.7'deki subscription zaten yakalar) | T3.6 |
| **T3.8** | Kartları votes'a göre sıralama (client-side, voting/finished'da) | 5 dk | En çok oylu üstte | T3.6 |

---

## 🟠 P4 — Aksiyonlar + Dashboard (8 task)

| ID | Task | Süre | Çıktı | Bağımlılık |
|----|------|------|-------|-----------|
| **T4.1** | `src/components/ui/Modal.tsx` — basit overlay modal | 10 dk | Overlay + backdrop + close | T2.2 |
| **T4.2** | `src/components/retro/ActionForm.tsx` — assignedTo (select), description, deadline | 15 dk | Form modal içinde | T4.1 |
| **T4.3** | RetroCard'a "Aksiyon Ekle" butonu (sadece SM/Admin, status='finished'/voting) | 5 dk | Buton görünür | T4.2 |
| **T4.4** | Action INSERT → actions tablosuna | 5 dk | Aksiyon DB'ye yazılır | T4.2 |
| **T4.5** | `src/app/dashboard/page.tsx` — sayfa iskeleti, yetki kontrolü | 5 dk | Manager/Admin görür | T1.5 |
| **T4.6** | Actions + ilgili card + retro session JOIN fetch | 10 dk | Detaylı action listesi | T4.4 |
| **T4.7** | `src/components/dashboard/ActionsTable.tsx` — tablo, sortable header'lar | 15 dk | Aksiyon tablosu | T4.6 |
| **T4.8** | Deadline renk kodlaması (kırmızı/sarı/yeşil) + filter dropdown | 10 dk | Görsel önceliklendirme | T4.7 |

---

## 🟠 P5 — Polish (6 task)

| ID | Task | Süre | Çıktı | Bağımlılık |
|----|------|------|-------|-----------|
| **T5.1** | Tüm async UI'larda loading skeleton/spinner | 10 dk | Boş ekran yok | tüm fetch'ler |
| **T5.2** | Try/catch'lerde inline error message div | 5 dk | Hata user'a görünür | T5.1 |
| **T5.3** | Empty state'ler: "Henüz retro yok", "Kart yok", "Aksiyon yok" | 5 dk | Boş tablo / liste mesajları | — |
| **T5.4** | Mobile responsive son geçiş: 375px width'te test | 10 dk | Mobil çalışır | — |
| **T5.5** | Favicon + meta title + Tailwind shadow/transition cilası | 5 dk | Görsel polish | — |
| **T5.6** | Demo akış prova: 5 dakikalık senaryoyu kesintisiz oynat | 10 dk | Akış sağlam | hepsi |

---

## 🔵 P6 — Deploy (4 task)

| ID | Task | Süre | Çıktı | Bağımlılık |
|----|------|------|-------|-----------|
| **T6.1** | `.gitignore`'da `.env.local` doğrula, son commit | 2 dk | Repo temiz | tüm |
| **T6.2** | Vercel → "New Project" → GitHub repo bağla | 3 dk | Proje import edildi | T6.1 |
| **T6.3** | Vercel env vars: SUPABASE_URL + ANON_KEY | 2 dk | Env vars set | T6.2 |
| **T6.4** | Deploy → URL'i README'ye ekle → final push | 5 dk | Public URL canlı | T6.3 |

---

## 📊 Toplam Task Sayısı

| Faz | Task Sayısı | Tahmini Süre |
|---|---|---|
| P0 Setup | 5 | 19 dk |
| P1 DB+Auth | 6 | 39 dk |
| P2 Board UI | 10 | 105 dk |
| P3 Voting | 8 | 60 dk |
| P4 Actions+Dash | 8 | 75 dk |
| P5 Polish | 6 | 45 dk |
| P6 Deploy | 4 | 12 dk |
| **TOPLAM** | **47 task** | **355 dk** |

> ⚠️ **Tahmin > 3 saat.** Bu listeden P5.4, P5.5 gibi non-critical task'lar buffer dışındaki süreye kayabilir. Önce P0→P4 zincirini tamamla, sonra P5'i traşla.

---

## 🚦 Önceliklendirme

### MUST-HAVE (demo için zorunlu)
- T0.1–T0.5 (setup hepsi)
- T1.1, T1.2, T1.5, T1.6 (DB + login)
- T2.5–T2.10 (board core)
- T3.1, T3.2, T3.4, T3.6 (aşama + oy)
- T4.2–T4.4 (aksiyon ekle)
- T4.5–T4.7 (dashboard temel)
- T6.1–T6.4 (deploy)

### NICE-TO-HAVE (zaman varsa)
- T1.4 (full type sistemi)
- T2.1 (header)
- T3.5 (oy limiti UI)
- T3.8 (sort)
- T4.8 (deadline renk)
- T5.* (polish)

### CUT FIRST (gerekirse atılır)
- T2.3 (retro listesi) → tek aktif odayı hard-code'la
- T4.8 deadline renk kodları
- T5.4 mobile responsive (sadece desktop demo)

---

## 🎯 Task Çekme Stratejisi

1. Setup hızlı bitir (T0)
2. T1.1–T1.6'yı paralel düşünme, sırayla — DB olmadan login olmaz
3. T2.5 (board page) iskeletini erken aç, sonra useCards'ı bağla
4. T3'te aşama logic'i bitmeden T4'e geçme
5. T4 bitince hemen T6.2'yi başlat (Vercel deploy ağ trafiği arka planda)
6. Son 15 dk **sadece** demo prova ve bugfix

**Komit sıklığı:** her task sonu = 1 commit. Mesaj formatı: `feat(p2): T2.7 useCards hook`.
