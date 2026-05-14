# 🛠️ 06 — Teknoloji Yığını

Her teknoloji seçiminin **nedeni** belirtildi. Hackathon = "neden bu, neden bu değil" sorularına 1 cümlede cevap.

---

## 🎯 Core Stack

| Teknoloji | Versiyon | Neden? |
|---|---|---|
| **Next.js** | 14.x | App Router ile Server/Client component karışımı, hızlı geliştirme, Vercel'le sıfır config deploy |
| **React** | 18.x | Next.js'in default'u, Server Components için gerekli |
| **TypeScript** | 5.x | Type safety, IDE auto-complete; supabase-js zaten TS-first |
| **Tailwind CSS** | 3.x | Utility-first → hızlı style, custom CSS sıfır |
| **Supabase** | Latest | Postgres + Auth + Realtime + Storage tek pakette; backend yazmadan MVP |
| **`@supabase/supabase-js`** | 2.x | Resmi JS client, Realtime WebSocket dahil |

---

## 📦 npm Paketleri

### Dependencies

```bash
npm install \
  next \
  react \
  react-dom \
  @supabase/supabase-js \
  uuid
```

### Dev Dependencies

`create-next-app` zaten kuruyor:

```bash
# Otomatik gelenler
typescript
@types/node
@types/react
@types/react-dom
tailwindcss
postcss
autoprefixer
eslint
eslint-config-next

# Ek kuracaklarımız
npm install --save-dev @types/uuid
```

### Yüklenmeyenler (Bilinçli)

| Paket | Neden YOK? |
|---|---|
| `zustand` / `redux` | Tek session state'i `useState` ve hooks ile yeterli |
| `react-query` / `swr` | Supabase realtime + useEffect yetiyor |
| `react-hook-form` | 1-2 form var, `useState` yeterli |
| `zod` | Validation client-side basit, ekstra deps zaman kaybı |
| `framer-motion` | Tailwind `transition` yetiyor |
| `shadcn/ui` | Init wizard süreci uzun, custom components 30 dk |
| `lucide-react` | İcon az; varsa unicode emoji yeterli (🎯 📋 ✅) |
| `date-fns` | Deadline format için `Intl.DateTimeFormat` veya `toLocaleDateString` |

---

## 🏗️ create-next-app Komutu

```bash
npx create-next-app@latest hackathon-retro \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias
```

Bayrak açıklamaları:
- `--typescript` → TS template
- `--tailwind` → Tailwind otomatik kurulu
- `--eslint` → linter aktif
- `--app` → App Router (Pages Router DEĞİL)
- `--src-dir` → `src/` klasörü kullan (mantıklı ayrım)
- `--no-import-alias` → `@/` alias default zaten geliyor, sormaya gerek yok

**Hata yapma:** `--turbopack` ekleme; ara sıra build sorunu çıkarıyor demo'da.

---

## 🌐 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://cinoypeobrrcudpsasld.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<senin-anon-key>
```

> `NEXT_PUBLIC_` prefix → client-side erişim. Anon key zaten public olarak tasarlanmış.

### `.env.example` (commit edilecek)

```bash
# .env.example — repo'ya commit'lenir, gerçek değerler değil
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## ⚙️ TypeScript Config

`tsconfig.json` create-next-app'tan gelen versiyonu kullan. Hackathon için:

```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,  // ← Hackathon hızı için strict=false; production'da true
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`"strict": false` → "null check yapmadın" hataları için 3 saatte 20 dakika kazandırır. Production öncesi `true` yap.

---

## 🎨 Tailwind Config

`tailwind.config.ts` create-next-app default'u yetiyor. Tek ekleme:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mad:  { 50: "#fef2f2", 500: "#ef4444", 700: "#b91c1c" },
        glad: { 50: "#f0fdf4", 500: "#22c55e", 700: "#15803d" },
        sad:  { 50: "#eff6ff", 500: "#3b82f6", 700: "#1d4ed8" },
      },
    },
  },
  plugins: [],
};
export default config;
```

Bu sayede `bg-mad-50`, `text-glad-700` gibi semantic class'lar kullanılabilir.

---

## 🔄 Realtime Akış Tercihi

| Yaklaşım | Durum | Neden? |
|---|---|---|
| **Supabase Realtime (postgres_changes)** | ✅ KULLANIYORUZ | Built-in, ekstra infra yok |
| Supabase Broadcast (peer-to-peer) | ❌ | Kart "persist" olmuyor, sadece transient |
| WebSocket kendi sunucu | ❌ | Backend yazmıyoruz |
| Polling (3 sn'de 1 fetch) | 🟡 Fallback | Realtime çalışmazsa demo gece son anda buraya geç |

---

## 🧰 Geliştirme Araçları

| Araç | Kullanım |
|---|---|
| **Cursor / VS Code** | IDE — TypeScript için ikisi de iyi |
| **Supabase Dashboard** | SQL editor, table editor, realtime monitor |
| **Vercel Dashboard** | Deploy + env vars + logs |
| **Chrome DevTools** | Network tab (Supabase req'leri görmek için) |
| **Postman / Insomnia** | ❌ Gerek yok, Supabase JS client direkt |

---

## 📐 Browser Desteği

| Tarayıcı | Destekli mi? |
|---|---|
| Chrome (latest) | ✅ Birinci sınıf |
| Edge | ✅ |
| Firefox | ✅ |
| Safari | ✅ Realtime test edilmiş |
| Mobile Safari | 🟡 Demo'da kullanma; layout sorunları olabilir |
| Internet Explorer | ❌ Hayır |

Demo'da **Chrome** veya **Edge** kullan, sürpriz yaşamazsın.

---

## 📊 Bundle Boyutu Tahmini

| Modül | ~kb (gzipped) |
|---|---|
| Next.js framework | 90 |
| React + DOM | 40 |
| Supabase JS | 30 |
| Tailwind (purged) | 8 |
| App code | ~25 |
| **Toplam** | **~190 kb** |

3G üzerinde ~1 saniye, demo için sorun yok.

---

## 🚨 Bağımlılık Yönetimi Kuralları

1. **`package-lock.json` commit'lenir.** Reproducible build için şart.
2. **`node_modules/` `.gitignore`'da.** 200 MB push istemezsin.
3. **`npm ci` vs `npm install`:** Vercel `npm ci` kullanır (zaten lock dosyasından).
4. **Yeni paket ekleyince commit'le:** `npm install X` sonrası iki dosya değişir (`package.json` + `package-lock.json`), ikisini de commit'le.

---

## 🔧 Komut Referansı

```bash
# Geliştirme
npm run dev              # localhost:3000

# Production build (deploy öncesi test)
npm run build
npm run start            # localhost:3000 (production mode)

# Lint
npm run lint

# Tip kontrol
npx tsc --noEmit
```
