# 📜 CHANGELOG

Hackathon sırasında uygulamada yapılan değişikliklerin tarihçesi. En yeni en üstte.

---

## v0.6 — Önceki retro aksiyonları + deadline UX (2026-05-14)

- ✨ **Önceki retro aksiyonları**: Yeni bir retroyu açtığında, yazma aşamasının üstünde aynı ekibin **bir önceki retrosundan kalan aksiyonlar** banner olarak gösterilir. Açık/tamamlanan ayrımı + deadline durumu ile.
- ✨ **Default deadline 7 gün**: Aksiyon ekleme formunda deadline alanı **bugün + 7 gün** olarak prefill'lenir.
- ✨ **🔔 Deadline popup uyarısı**: Header'da 🔔 chip; gecikmiş + son 3 günde olan aksiyonlar için modal popup. Yöneticiler tüm aksiyonları, üyeler ve SM yalnızca kendilerine atananları görür. Pop-up oturum başına bir kez gösterilir, 6 saat dismiss TTL.
- ✨ **Reset & Seed**: `npm run seed` standalone script ve `/admin` sayfasında **🔄 Reset & Seed** butonu. Kanonik demo kullanıcılarını oluşturur:
  - Admin: `admin`
  - Yöneticiler: `Kaan`, `Batuhan`, `Çağrı`
  - Scrum Master: `Erhan`
  - Üyeler: `Kübra`, `Zeynep`, `Anıl`, `Uğur`

### Yeni dosyalar
- `scripts/seed.mjs` — Standalone seeder
- `src/lib/db/seed.ts` — `resetAndSeed()` fonksiyonu
- `src/app/api/admin/seed/route.ts` — POST endpoint
- `src/app/api/sessions/[id]/previous-actions/route.ts`
- `src/components/retro/PreviousActionsPanel.tsx`
- `src/components/ActionAlerts.tsx`
- `src/lib/utils/deadline.ts` — `deadlineMeta` + `todayPlus`

---

## v0.5 — Teams, timer, blur, grouping, group actions (2026-05-14)

6 büyük özellik birlikte:

1. **Yazma fazında kart blur**: Diğer kullanıcıların kartları `blur-sm select-none` ile bulanık; **kendi kartın net görünür**.
2. **SM yazma süresi seçer**: `retro/new` sayfasında "Yazma süresi (dk)" 1-30 arası. `writing_ends_at` insert anında hesaplanır.
3. **Canlı sayaç**: Tüm clientlerde MM:SS geri sayım; <30 sn amber pulse; 0 olunca "Süre doldu" kırmızı.
4. **Kart gruplama**: Status `finished` iken SM "Gruplama Modu" → kartlara tıklayarak seç → grup adı ver. `card_groups` tablosu + `cards.group_id`.
5. **Grup hedefli aksiyon**: ActionForm hem kart hem grup alabilir. Dashboard kaynak kolonu kart snippet'i veya grup badge + kart sayısı.
6. **Ekipler**: Admin → Ekipler sayfası — ekip oluştur, SM ata, üye ekle/çıkar. `users.team_id`, `teams` tablosu. Sessions team'e bağlı; üyeler sadece kendi ekibinin oturumlarını görür.

### Migration
Tüm yeni kolonlar `ensureColumn` helper'ı ile additive — mevcut data korunur.

---

## v0.4 — Supabase'den SQLite'a geçiş (2026-05-14)

- ❌ `@supabase/supabase-js` çıktı
- ✅ `better-sqlite3@^12.10.0` (Node 26 uyumlu)
- ✅ Next.js Route Handlers (`/api/*`) — REST + 2 SSE stream
- ✅ In-memory pub/sub → SSE (`postgres_changes` eşdeğeri)
- ✅ Auto-migrate, sıfır env var, `./data/retroflow.db`

Trade-off: Vercel'de çalışmaz (filesystem ephemeral). Local demo only.

---

## v0.3 — Supabase prerender fix (2026-05-14)

- 🐛 `/admin` build hatası: `supabaseUrl is required`
- ✅ Supabase client'a placeholder fallback eklendi (build geçiyor; runtime için Vercel env var şart)

---

## v0.2 — Full Retroflow MVP (2026-05-14)

- "Hello Team StackStorm" scaffold'u tamamen değiştirildi
- TypeScript + Tailwind + Supabase
- Login + 4 rol + role-based routing
- RetroBoard + 3-kolon Mad/Glad/Sad + Supabase Realtime
- PhaseControl, voting (per-user limit via localStorage)
- ActionForm, /dashboard (manager view), /admin (kullanıcı rolleri)

---

## v0.1 — Hello World scaffold (2026-05-14)

- Boş Next.js JS projesi, "Hello World" → "Hello Team StackStorm"
- GitHub MCP üzerinden ilk push'lar
