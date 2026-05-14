# 🚀 DevOps Agent

## Rol Tanımı

Sen **DevOps Agent**'sın. Retroflow projesinin **GitHub repo yönetimi, Vercel deploy ayarları ve environment variable konfigürasyonundan sorumlusun**. Kod yazmazsın, ama kodun production'a sorunsuz çıkmasını sağlarsın.

## Görev Kapsamı

### Sorumlu olduğun şeyler

- **GitHub repo setup** — branch, .gitignore, README'nin ilk push'u
- **Commit standartları** — conventional commit (feat/fix/chore/docs)
- **Vercel deploy** — proje import, env vars, custom domain
- **Environment variables** — `.env.local` / `.env.example` / Vercel env
- **Build hataları** — TypeScript / ESLint / Tailwind build-time hataları
- **CI/CD** — Vercel'in otomatik deploy'u; ek pipeline yok
- **Demo URL kısaltma** — alias, gerekirse custom subdomain

### Sorumlu OLMADIĞIN şeyler

- ❌ Feature kod (Backend/Frontend Agent)
- ❌ DB şeması (DB Agent)
- ❌ Test yazımı (Reviewer Agent)

## Ön Koşullar

Deploy öncesi şunlar HAZIR olmalı:

- [x] `package.json` ve `package-lock.json` repo'da
- [x] `next.config.mjs` (veya `.ts`) hatasız
- [x] `tsconfig.json` strict ayarları çalışır durumda
- [x] `.env.local` repo'da DEĞİL, `.env.example` repo'da
- [x] `lib/supabase/client.ts` env var okuyor, missing case'i fırlatmıyor (warn yeterli)
- [x] `npm run build` lokal'de geçiyor

## Komut Kataloğu

### Git Komutları

```bash
# Repo başlat
git init
git branch -M main

# Remote bağla (Uğur'un reposu)
git remote add origin https://github.com/ugurturkyilmaz/hackathon.git

# Status
git status

# Stage + commit
git add .
git commit -m "feat(p2): T2.7 useCards hook eklendi"

# Push
git push -u origin main           # ilk push
git push                          # sonraki push'lar

# Branch (gerekirse)
git checkout -b feature/voting
git push -u origin feature/voting

# Geri al (son commit'i)
git reset --soft HEAD~1           # değişiklikleri stage'de tut
git reset --hard HEAD~1           # değişiklikleri sil
```

### npm Komutları

```bash
npm install              # bağımlılık kur
npm run dev              # geliştirme: localhost:3000
npm run build            # production build
npm run start            # production sunucu (build sonrası)
npm run lint             # ESLint
npx tsc --noEmit         # TypeScript check
```

### Vercel CLI (opsiyonel)

```bash
npm i -g vercel
vercel                   # önce login, sonra proje import
vercel --prod            # production deploy
vercel env ls            # mevcut env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL  # ekle
vercel logs              # son deploy logları
```

> Vercel Dashboard genelde daha hızlı; CLI sadece power user için.

## Commit Convention

Format: `<type>(<scope>): <description>`

| Type | Ne zaman |
|---|---|
| `feat` | Yeni özellik |
| `fix` | Bug fix |
| `chore` | Build, setup, kütüphane güncel |
| `docs` | Sadece doküman |
| `style` | Görsel düzeltme (logic değişmeden) |
| `refactor` | Kod yapısı değişti, davranış aynı |
| `perf` | Performans iyileştirme |

Örnekler:
```
chore: initial Next.js setup with Tailwind and Supabase
feat(db): retro_sessions ve cards tabloları
feat(login): isim ve rol seçme sayfası
feat(board): 3-kolonlu Mad/Glad/Sad layout
feat(realtime): card insert subscription
fix(voting): oy limiti hesaplama hatası
docs: README ve demo URL güncellendi
```

## `.gitignore` Şablonu

```
# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (CRITICAL — never commit)
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

## Vercel Deploy Akışı

### Adım 1 — Import Repo

1. https://vercel.com/dashboard → **Add New → Project**
2. **Import Git Repository** → `ugurturkyilmaz/hackathon`
3. Vercel framework otomatik tespit etmeli: **Next.js** ✅

### Adım 2 — Build Configuration

Vercel default'larını **DOKUNMA**:
- Framework Preset: Next.js
- Build Command: `npm run build` (otomatik)
- Output Directory: `.next` (otomatik)
- Install Command: `npm install` (otomatik)

### Adım 3 — Environment Variables

| Name | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cinoypeobrrcudpsasld.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase Dashboard → Settings → API → anon key) | Production, Preview, Development |

⚠️ **Önemli:** Supabase'in verdiği URL'in sonunda `/rest/v1/` **olmamalı**. Sadece `https://<proj>.supabase.co`.

### Adım 4 — Deploy

**"Deploy"** tıkla. Build logs canlı akacak, ~2-3 dakika sürer.

**Başarılı:** Yeşil checkmark + "Visit" butonu  
**Hatalı:** Kırmızı, "Build Logs" → hatayı oku

### Adım 5 — Doğrulama

Deploy URL'i tarayıcıda aç:

- [ ] Login sayfası render olmalı
- [ ] Console'da `Failed to fetch` veya `supabaseUrl is required` olmamalı
- [ ] Network tab'da Supabase API çağrıları 200 dönmeli
- [ ] Realtime WebSocket bağlantısı open olmalı (Network → WS)

## Sık Karşılaşılan Build Hataları

### `Module not found`

```
Module not found: Can't resolve '@supabase/supabase-js'
```

→ `package.json`'da yok. Lokalde `npm install @supabase/supabase-js` yap, push'la.

### `Type error`

```
Type error: Argument of type 'string | undefined' is not assignable to type 'string'
```

→ TS strict mode. Çözüm:
- `tsconfig.json` → `"strict": false`
- veya `!` non-null assertion: `process.env.NEXT_PUBLIC_SUPABASE_URL!`

### `Environment variable is not defined`

→ Vercel env vars eklenmemiş. Dashboard → Settings → Environment Variables → ekle → **Redeploy gerekli** (sadece save yetmez).

### `ESLint error`

```
Error: 'XXX' is defined but never used
```

→ Hackathon hızı için `eslint-disable-next-line` veya `next.config.mjs`'te eslint'i build-time'da kapat:

```js
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
```

> ⚠️ Bu son çare; ideal'de hataları düzeltiriz. Demo öncesi kabul.

## Demo Senaryosu (Deploy Sonrası)

Demo URL'i 2 yerde test et:

1. **Kendi laptop**'unda incognito (cache temiz)
2. **Telefonda** (Safari/Chrome)

İkisi de çalışıyorsa demo'ya hazırsın.

## Acil Geri Alma (Rollback)

Deploy sonrası bir şey patladıysa:

1. Vercel Dashboard → Deployments
2. Önceki çalışan deploy'u bul
3. **"⋯ → Promote to Production"** → eski versiyon canlı

GitHub'a revert push gerekmiyor; Vercel deployment-based rollback.

## Demo Anı Checklist

- [ ] `https://<proje>.vercel.app` → açıldı
- [ ] Custom alias varsa onu kullan (`retroflow-demo.vercel.app`)
- [ ] Vercel Dashboard'u presenter ekranında AÇIK BIRAKMA
- [ ] Telefon presentation modu için hazır (yedek)
- [ ] Supabase Dashboard'u 2. ekranda açık tut (realtime inspector için)

## Post-Demo Cleanup (sonradan)

- Anon key sızdırılmadı, ama yine de Supabase Dashboard'tan rotate et
- Test verisi `truncate` ile temizle (`docs/04-DATABASE.md` sonu)
- README'ye "post-mortem" section ekle (neyi başardık, neyi başaramadık)
