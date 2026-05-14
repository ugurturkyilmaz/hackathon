# ⏱️ 02 — Geliştirme Fazları

3 saatlik hackathon için 7 fazlı plan. Her fazın **çıktısı (deliverable)**, **çalışırlık tanımı (definition of done)**, ve **olası takılma noktaları** var.

> **Felsefe:** Her fazın sonunda, demo'nun *o ana kadarki kısmı* zaten çalışıyor olmalı. Faz 3 bitmeden Faz 5'e atlama yok. Demo'da gösterilecek en az 1 şey her faz sonunda çıkmalı.

---

## 🟢 Faz 0 — Setup (0:00 – 0:20)

**Hedef:** Çalışan boş Next.js + Supabase bağlantısı.

### Görevler
- [ ] `npx create-next-app@latest` — App Router, TS, Tailwind, src/ dir, no eslint-strict
- [ ] `npm i @supabase/supabase-js uuid`
- [ ] `.env.local` oluştur (URL + anon key)
- [ ] `lib/supabase/client.ts` Supabase singleton
- [ ] `types/index.ts` boş domain type'ları
- [ ] Git init, GitHub repo bağla, ilk commit "chore: setup"

### Definition of Done
- `npm run dev` çalışıyor, default Next.js sayfası açılıyor
- Supabase client import edilebiliyor, `supabase.auth.getSession()` console'da promise dönüyor

### Olası Takılmalar
- Tailwind directives `globals.css`'e gelmediyse → manuel ekle
- ESLint/TS hataları → `eslint.config.mjs`'ten katı kuralları gevşet

---

## 🟢 Faz 1 — DB Şeması + Login (0:20 – 0:45)

**Hedef:** Veritabanı hazır + isim/rol seçimi sayfası çalışıyor.

### Görevler
- [ ] Supabase SQL Editor: `docs/04-DATABASE.md` içindeki SQL'i çalıştır
- [ ] Realtime publication: `users`, `retro_sessions`, `cards`, `actions` tablolarına replikasyon aç
- [ ] Test query: `select * from users` → admin satırını gör
- [ ] `app/page.tsx` — isim input + rol select (4 rol) + "Devam" butonu
- [ ] `lib/hooks/useCurrentUser.ts` — localStorage read/write
- [ ] Devam butonu → users tablosuna upsert + redirect

### Definition of Done
- Login sayfasında isim yaz, rol seç, devam et
- localStorage'da `currentUser` görünür
- Supabase'de `users` tablosunda yeni kayıt var
- Rol bazlı redirect: Admin→/admin, SM/Member→/retro, Manager→/dashboard

### Olası Takılmalar
- localStorage SSR'da yok → `'use client'` + `useEffect`
- UUID format Supabase ile çelişebilir → `crypto.randomUUID()` veya `uuid` paketi

---

## 🟡 Faz 2 — Retro Board UI (0:45 – 1:35)

**Hedef:** Üye kart yazabiliyor, kartlar realtime herkese gözüküyor.

### Görevler
- [ ] `app/retro/page.tsx` — aktif retro odalarını listele
- [ ] `app/retro/new/page.tsx` — SM için yeni oda formu
- [ ] `app/retro/[sessionId]/page.tsx` — board sayfası iskeleti
- [ ] `components/retro/RetroBoard.tsx` — 3 kolon (Mad / Glad / Sad)
- [ ] `components/retro/CardColumn.tsx` — kolon başlığı, kart listesi, "+ Add"
- [ ] `components/retro/RetroCard.tsx` — kart UI
- [ ] `lib/hooks/useCards.ts` — kartları fetch + insert
- [ ] Realtime subscription cards tablosuna
- [ ] Manuel test: 2 sekme aç, birinde kart ekle, diğerinde gözüksün

### Definition of Done
- Yeni oda oluşturulabilir
- Board sayfasında 3 kolon görünür
- Kart eklendiğinde **anında** ve **diğer sekmede de** gözükür
- Kategori renkleri net (red/green/blue paletleri)

### Olası Takılmalar
- Realtime event geliyor ama state güncellenmiyor → channel cleanup eksik veya state setter'ın closure'u eski
- "Add Card" 2x kart ekliyor → optimistic + realtime double insert; sadece realtime'a güven

---

## 🟡 Faz 3 — Aşama Yönetimi + Oylama (1:35 – 2:15)

**Hedef:** SM aşamayı değiştirebiliyor, üyeler oy verebiliyor.

### Görevler
- [ ] `components/retro/PhaseControl.tsx` — SM görür, "Oylamaya Geç" / "Aksiyonlara Geç" / "Bitir" butonları
- [ ] `lib/hooks/useRetroSession.ts` — session realtime + update mutation
- [ ] Status'a göre UI değiş:
  - `writing` → input görünür, oy butonu yok
  - `voting` → input gizli, oy butonu var, oy sayacı görünür
  - `finished` → her şey read-only, "Aksiyon ekle" butonu (SM/Admin)
- [ ] Kişi başı oy limiti: oda oluştururken seç (default 3)
- [ ] Local state: `votesUsedByCurrentUser` → limit aşılırsa buton disabled
- [ ] `cards.votes` increment (atomic için RPC kullanmıyoruz; simple update yeterli demo'da)
- [ ] Oy verme sonrası en çok oylulardan sıralama (client-side sort)

### Definition of Done
- SM "Oylamaya Geç" tıklar → tüm sekmelerde oy butonları belirir
- Üye 👍 tıklar → kartın oy sayısı her yerde +1 olur
- 3 oy verince 4. butonu disabled
- En çok oy alan kart en üste çıkar

### Olası Takılmalar
- Race condition: 2 kişi aynı anda oy → demo için kabul (last write wins)
- Oy limit local state, refresh'te sıfırlanır → kabul (3 saatlik MVP)

---

## 🟠 Faz 4 — Aksiyonlar + Executive Dashboard (2:15 – 2:45)

**Hedef:** Aksiyon eklenebiliyor, Manager dashboard'unda görünüyor.

### Görevler
- [ ] `components/retro/ActionForm.tsx` — modal: assignedTo, description, deadline
- [ ] `finished` veya `voting+admin` durumunda kartlara "Aksiyon Ekle" butonu
- [ ] Action insert → `actions` tablosu
- [ ] `app/dashboard/page.tsx` — Manager/Admin için
- [ ] `components/dashboard/ActionsTable.tsx` — tablo: kart konusu, sorumlu, deadline, status, retro adı
- [ ] Deadline geçmişse kırmızı, 3 gün kala sarı, ileride yeşil
- [ ] Read-only — düzenle butonu yok
- [ ] Filter: tüm/açık/biten (basit select)

### Definition of Done
- SM bir karta tıklar → "Aksiyon Ekle" → form → kaydet
- Manager dashboard'una git → aksiyon listede
- Deadline rengi doğru kategorize edilmiş
- Filter çalışıyor

### Olası Takılmalar
- "assignedTo" dropdown — users tablosundan tüm member'ları çek, basit `<select>`
- Deadline date format — `<input type="date">` yeterli

---

## 🟠 Faz 5 — Polish + Loading/Error States (2:45 – 3:00)

**Hedef:** Demo'ya hazır, profesyonel görünüm.

### Görevler
- [ ] Tüm fetch'lere loading skeleton/spinner
- [ ] Hata durumunda inline error mesajı (try/catch + toast değil, div)
- [ ] Empty states: "Henüz retro yok", "Kart yok", "Aksiyon yok"
- [ ] Header'a kullanıcı adı + rol badge
- [ ] "Çıkış yap" butonu (localStorage clear + redirect)
- [ ] Favicon ekle
- [ ] Mobile responsive son kontrol (Chrome DevTools 375px width)
- [ ] Tailwind shadow, rounded, hover transitions

### Definition of Done
- Hiçbir async işlemde "boş ekran" görünmüyor
- Mobile portrait'te board 3 kolon yerine 1 kolon (scroll)
- 5 dakikada demo akışı kesintisiz tekrarlanabiliyor

---

## 🔵 Faz 6 — GitHub + Vercel Deploy (3:00 – 3:10)

**Hedef:** Public URL üzerinden demo verilebilir.

### Görevler
- [ ] `.env.local` `.gitignore`'da olduğunu doğrula
- [ ] Final commit: `feat: hackathon mvp ready`
- [ ] Push: `git push origin main`
- [ ] Vercel: import GitHub repo
- [ ] Environment variables ekle (URL + anon key)
- [ ] Deploy
- [ ] Deploy URL'ini README'ye ekle, son commit + push

### Definition of Done
- `https://<proje>.vercel.app` açılıyor
- Login → retro → board akışı production'da çalışıyor
- Realtime production'da da çalışıyor

---

## ❄️ Buffer (var ise zaman)

Önceliğe göre eklenebilecekler:
1. SM oda başlatınca otomatik oy süresi countdown
2. Kart anonimliği toggle (yazan adını gizle/göster)
3. Aksiyon completion checkbox
4. Geçmiş retro listesi
5. Animasyon transitions (`transition-all duration-200`)

**Buffer'a girmeden önce her fazın DoD'unu doğrula.**

---

## 📊 Faz Tamamlanma Tablosu

| Faz | Süre Hedefi | Çalışan Şey |
|---|---|---|
| 0 | 20 dk | Boş app + DB bağlantı |
| 1 | 25 dk | Login + DB şema |
| 2 | 50 dk | Kart yazma + realtime |
| 3 | 40 dk | Aşama + oylama |
| 4 | 30 dk | Aksiyon + dashboard |
| 5 | 15 dk | Polish |
| 6 | 10 dk | Deploy |

**Toplam: 190 dk** — 10 dk buffer.
