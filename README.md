# 🔄 Retroflow — Takım Retrospektif Platformu

> Ekiplerin retrospektif toplantılarını kendi web uygulamamız üzerinden yapmasını sağlayan, alınan aksiyon maddelerinin takibini kaybetmeyen full-stack MVP.

**Hackathon:** 3 saatlik sürede geliştirilen demo odaklı MVP
**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase

---

## 🎯 Problem

Ekipler retrospektif toplantılarını dış platformlarda (Miro, Mural, kağıt) yapıyor. Alınan aksiyon maddeleri toplantı bitince havada kalıyor, sprint'ten sprint'e takip edilemiyor.

## ✅ Çözüm

- Retro odası oluşturup ekipçe **Mad / Glad / Sad** kartları yazma
- **Yazma → Oylama → Aksiyon** aşamalı akışı
- Aksiyon maddelerini sahibine ve deadline'a bağlama
- Yöneticiler için **read-only** executive dashboard

---

## 👥 Roller

| Rol | Yetki |
|---|---|
| **Admin** | Tüm dashboard'u görür, kişilere rol atar |
| **Scrum Master** | Retro oturumu başlatır, aşamaları yönetir, oy limitlerini ayarlar |
| **Ekip Üyesi** | Kart yazar, başkalarının kartlarına oy verir |
| **Yönetici** | Read-only: tüm aksiyon listesini ve geçmiş retro çıktılarını görür |

---

## 📁 Proje Yapısı

```
hackathon-retro/
├── README.md                       ← Bu dosya
├── docs/                           ← Plan ve mimari dokümanları
│   ├── 00-PLAN.md                 ← Genel plan ve başarı kriterleri
│   ├── 01-ARCHITECTURE.md         ← Sistem mimarisi
│   ├── 02-PHASES.md               ← Geliştirme fazları (3 saatlik plan)
│   ├── 03-TASKS.md                ← Detaylı task breakdown
│   ├── 04-DATABASE.md             ← Supabase şema ve SQL
│   ├── 05-DEPLOYMENT.md           ← Vercel deploy adımları
│   └── 06-TECH-STACK.md           ← Teknolojiler ve npm paketleri
├── .claude/
│   ├── agents/                    ← AI agent profilleri (her rol için)
│   │   ├── backend-agent.md
│   │   ├── frontend-agent.md
│   │   ├── db-agent.md
│   │   ├── devops-agent.md
│   │   └── reviewer-agent.md
│   └── skills/                    ← Tekrar kullanılabilir skill kütüphanesi
│       ├── supabase-setup/
│       ├── nextjs-app-router/
│       ├── retro-flow-logic/
│       ├── role-based-access/
│       └── realtime-subscriptions/
└── (Next.js kod dosyaları sonraki adımda)
```

---

## 🚀 Hızlı Başlangıç

```bash
# 1. Bağımlılıkları kur
npm install

# 2. Environment değişkenlerini ekle (.env.local)
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY'i doldur

# 3. Supabase tablolarını oluştur
# docs/04-DATABASE.md içindeki SQL'i Supabase SQL Editor'da çalıştır

# 4. Geliştirme sunucusunu başlat
npm run dev
```

---

## 📚 Dokümantasyon

Detaylı kurulum, mimari ve geliştirme süreci için **`docs/`** klasörüne bakın:

1. [`00-PLAN.md`](docs/00-PLAN.md) — Plan ve başarı kriterleri
2. [`01-ARCHITECTURE.md`](docs/01-ARCHITECTURE.md) — Mimari
3. [`02-PHASES.md`](docs/02-PHASES.md) — Geliştirme fazları
4. [`03-TASKS.md`](docs/03-TASKS.md) — Task breakdown
5. [`04-DATABASE.md`](docs/04-DATABASE.md) — Veritabanı şeması
6. [`05-DEPLOYMENT.md`](docs/05-DEPLOYMENT.md) — Deploy
7. [`06-TECH-STACK.md`](docs/06-TECH-STACK.md) — Stack

---

## 🛠️ Agent ve Skill Sistemi

`.claude/` klasörü, geliştirme sürecinde tekrar kullanılabilir AI agent prompt'ları ve skill tanımları içerir. Agent'lar belirli rolleri üstlenir (backend, frontend, db, devops), skill'ler ise belirli pattern'leri (Supabase setup, RBAC, realtime) tekrar tekrar üretmek için referans noktasıdır.

---

## 📝 Lisans

MIT — hackathon demosu, free kullanım.
