# 📋 00 — Plan

## 🎯 Proje Adı

**Retroflow** — Takım Retrospektif Yönetim Platformu

## 🧩 Problem Tanımı

Ekipler retrospektif toplantılarını Miro, Mural, kağıt-kalem gibi dış araçlarda yapıyor. Toplantı bitince:
- Aksiyon maddeleri başka bir yere transfer edilmiyor
- Sahibi belirsiz kalıyor
- Bir sonraki sprint'te unutuluyor
- Yönetici görünürlüğü sıfır

## ✨ Vizyon (3 cümle)

Retroflow, ekibin retrospektif kartını yazdığı, oylandığı, aksiyona dönüştüğü ve unutulmadığı tek yerdir. Yöneticiler hangi ekibin ne kararı aldığını gerçek zamanlı görür. Scrum Master toplantıyı dijital olarak yönetir, herkes aynı sayfada kalır.

---

## 🎯 MVP Kapsamı (Bu hackathon için)

### ✅ İÇERİDE (Must-have)

1. **Basit giriş**: İsim + rol seçimi (auth complexity yok)
2. **Retro odası**: SM oda açar, üyeler katılır
3. **Mad / Glad / Sad kart yazma**: 3 kolonlu board, anonim kartlar
4. **Aşama yönetimi**: SM `writing → voting → finished` geçişini tetikler
5. **Oylama**: Kişi başı oy limiti, kart başına oy sayısı
6. **Aksiyon tanımlama**: Kart → aksiyon (kim, ne, ne zamana kadar)
7. **Executive Dashboard**: Yöneticiler için read-only aksiyon listesi
8. **Realtime senkronizasyon**: Kart eklendiğinde herkes görür

### ❌ DIŞARIDA (Hackathon sonrası)

- E-mail/password ile auth (sadece role-select)
- Kart gruplama (drag-drop merge)
- Anonimlik toggle
- Çoklu workspace
- Bildirim sistemi
- Aksiyon completion tracking flow
- Geçmiş retro karşılaştırma

---

## 📊 Başarı Kriterleri

### Demo sırasında gösterilecek "wow" anları

1. 🎬 **5 saniyede oda açılışı**: SM giriş → oda kodu → board görünür
2. 🎬 **Realtime sihir**: 2 farklı tarayıcı yan yana → biri kart ekler, diğerinde anında belirir
3. 🎬 **Aşama geçişi**: SM "Oylama"ya geç → tüm ekranda yazma alanları kilitlenir, oy butonları gelir
4. 🎬 **Aksiyon ekleme**: Top-voted kart → "Aksiyon tanımla" butonu → form → dashboard'a düşer
5. 🎬 **Executive Dashboard**: Yönetici girer → tüm ekiplerin aksiyonları bir tablo, deadline yaklaşanlar kırmızı

### Teknik kriterler

- [x] Mobile responsive (en azından phone-portrait çalışır)
- [x] Loading state her async operation'da
- [x] Error state hata olduğunda görünür
- [x] Vercel'e tek tıkla deploy edilir
- [x] README ile yeni biri 10 dakikada çalıştırabilir

---

## ⏱️ Zaman Bütçesi (3 saat)

| Faz | Süre | Çıktı |
|---|---|---|
| 0. Setup | 20 dk | Next.js + Supabase + Tailwind hazır |
| 1. DB & Auth | 25 dk | Supabase tabloları, role-select login |
| 2. Retro Board UI | 50 dk | Kart yazma + 3-kolonlu board |
| 3. Aşama + Oylama | 40 dk | SM kontrolleri + oy mekanizması |
| 4. Aksiyonlar + Dashboard | 30 dk | Aksiyon formu + executive view |
| 5. Realtime + Polish | 15 dk | Supabase channel + UX cilası |
| 6. Deploy + README | 10 dk | Vercel + GitHub push |
| **Toplam** | **180 dk** | |

Detaylı task breakdown: [`03-TASKS.md`](./03-TASKS.md)

---

## 🚨 Risk Maddeleri

| Risk | Etki | Önlem |
|---|---|---|
| Supabase Realtime gecikmesi | Demo "wow" anı kaçar | Realtime'ı son fazda ekle, olmazsa polling fallback |
| RLS policy karışıklığı | Veri görünmez | MVP için RLS açık değil, anon key her şeyi görür (demo) |
| Role state localStorage'da | Refresh'te kaybolur | Kabul ediyoruz, demo akışında refresh yok |
| Drag-drop'a kapılmak | Zaman kaybı | Drag-drop YOK, sadece tıkla-ekle |

---

## 🎬 Demo Senaryosu (5 dakika)

1. **(0:00)** SM girişi → "Sprint 12 Retro" odasını açar
2. **(0:30)** İkinci sekme: Ekip üyesi katılır, board'u görür
3. **(0:50)** Üye Mad/Glad/Sad'a 2'şer kart atar, ilk sekmede anında belirir
4. **(2:00)** SM "Oylama" aşamasına geçer, oy limiti 3
5. **(2:30)** Üye kartlara oy verir, en çok oy alan üste çıkar
6. **(3:30)** SM en çok oy alan karta tıklar → aksiyon ekler (kim, ne, deadline)
7. **(4:00)** Yönetici sekmesi: Executive Dashboard → aksiyon görünür, deadline kırmızı vurgulu
8. **(4:30)** "Retroflow'da retro biter, takip başlamış olur" mesajı
