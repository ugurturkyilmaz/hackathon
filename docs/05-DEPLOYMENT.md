# 🚀 05 — Deployment

GitHub'a push + Vercel'e deploy. Total ~10 dakika.

---

## 📦 GitHub Hazırlık

### 1. `.gitignore` Doğrula

Default `create-next-app` ile gelen `.gitignore`'da bunlar olmalı:

```
# dependencies
/node_modules

# env
.env.local
.env.*.local

# next
/.next/
/out/

# vercel
.vercel
```

`.env.local` listede DEĞİLSE → manuel ekle. Anon key bile olsa public repo'ya commit etme.

### 2. Repo Bağlama

```bash
cd hackathon-retro

git init
git branch -M main
git add .
git commit -m "chore: initial setup with plan, agents, skills"

# Senin repo:
git remote add origin https://github.com/ugurturkyilmaz/hackathon.git
git push -u origin main
```

İlk push'ta dokümantasyon + .claude klasörü gider. Kod commit'leri sonraki adımlarda.

### 3. Commit Stratejisi

Hackathon hızı için **küçük commit'ler**:

```bash
git commit -m "feat(setup): Next.js + Supabase + Tailwind kurulum"
git commit -m "feat(db): Supabase tabloları ve types"
git commit -m "feat(login): isim + rol seçimi sayfası"
git commit -m "feat(board): retro board iskeleti ve 3 kolon"
git commit -m "feat(cards): kart ekleme + realtime senkronizasyon"
git commit -m "feat(voting): aşama yönetimi + oy mekanizması"
git commit -m "feat(actions): aksiyon formu + executive dashboard"
git commit -m "polish: loading + error state + responsive"
git commit -m "docs: README ve deploy URL güncelle"
```

---

## ☁️ Vercel Deploy

### 1. Hesap ve Proje Kur

1. [https://vercel.com](https://vercel.com) → GitHub ile giriş
2. **"Add New" → "Project"**
3. **"Import Git Repository"** → `ugurturkyilmaz/hackathon`
4. **"Import"** tıkla

### 2. Configure Project

Vercel otomatik tespit eder:
- **Framework Preset:** Next.js ✅ (auto-detect)
- **Root Directory:** `./` (proje root'taysa)
- **Build Command:** `next build` (otomatik)
- **Output Directory:** `.next` (otomatik)

### 3. Environment Variables

**"Environment Variables"** bölümünde 2 değişken ekle:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cinoypeobrrcudpsasld.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase Dashboard → Settings → API → anon public) |

> **Önemli:** URL'in sonunda `/rest/v1/` **olmamalı**. Supabase client kendi ekler. Sadece base URL: `https://<proje-id>.supabase.co`

### 4. Deploy

**"Deploy"** butonuna tıkla. ~2-3 dakika sonra:

- Build logs canlı akar
- Hata varsa kırmızı, başarılıysa yeşil "Visit"
- Visit → `https://<proje-adi>.vercel.app`

### 5. Custom Domain (Opsiyonel)

Eğer Vercel'de hazır domain'in varsa **Settings → Domains** → ekle.

---

## 🐛 Sık Karşılaşılan Sorunlar

### "Module not found: @supabase/supabase-js"

`package.json`'da bağımlılık eksik. Lokal'de `npm i` çalıştır, `package-lock.json`'u commit'le, tekrar push'la.

### "supabaseUrl is required"

Vercel env vars set edilmemiş veya isim yanlış. `NEXT_PUBLIC_` prefix'i **şart**.

### Build başarılı ama Realtime çalışmıyor

1. Supabase Dashboard → Database → Replication → tablolar publication'da mı?
2. Browser console'da WebSocket error var mı?
3. CORS — Supabase default tüm origin'lere açık, sorun olmamalı

### "TypeError: Cannot read properties of null (reading 'name')"

`localStorage` SSR'da yok. Login sayfasında `useEffect` içinde okunmalı. `'use client'` directive'i unutma.

### Build hatası: TypeScript strict

`tsconfig.json`'da `"strict": false` veya hata veren satırı `// @ts-ignore` ile by-pass et (hackathon hızı için).

---

## 🔄 Continuous Deployment

`main` branch'e her push otomatik deploy tetikler. Pull request açarsan Vercel **preview deploy** verir (PR yorumunda link).

---

## 📊 Deploy Sonrası Doğrulama Listesi

- [ ] `https://<proje>.vercel.app` açılıyor
- [ ] Login sayfası geliyor
- [ ] İsim + rol seçimi çalışıyor
- [ ] Retro odası oluşturulabiliyor
- [ ] Kart ekleme çalışıyor
- [ ] 2 farklı browser'da realtime senkronize
- [ ] Aşama geçişi çalışıyor
- [ ] Aksiyon ekleme + dashboard
- [ ] Mobile (telefon) görünüm makul

Tümü ✅ ise demo'ya hazırsın.

---

## 🎬 Demo URL Paylaşımı

Vercel deploy URL'i çok uzun (`hackathon-<hash>-ugurturkyilmaz.vercel.app`). Demo öncesi:

1. Vercel **Settings → Domains** → daha kısa alias ekle
2. Veya `hackathon.vercel.app` zaten alındıysa: `retroflow-mvp.vercel.app` tarzı
3. README'nin en üstüne bu URL'i koy

Demo presenter'ın slide'larında bu URL büyük büyük olmalı.
