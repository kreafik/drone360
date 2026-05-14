# CLAUDE.md — 360° Panorama Platform

> Bu dosya Claude Code'un projeyi her açışında okuyacağı master rehberdir. Diğer döküman dosyalarına buradan referans verilir.

---

## 🎯 Proje Özeti

**İsim:** (Henüz yok — proje sahibi seçecek, geçici: `drone-360`)

**Sahip:** Tek bir admin (proje sahibi). Drone ile gayrimenkul ve tekne çekimleri yapıyor.

**Ne işe yarayacak:**
- Çekilen 360° equirectangular panoramaları yükleme
- Panoramaları birbirine bağlayıp sanal tur oluşturma (hotspot'lar)
- Müşterilere özel link / hesap üzerinden gösterme
- Her projenin görüntülenme analitiğini tutma
- Web sitelerine gömülebilen (embed) viewer

**Benzer ürün:** https://panoee.live/ — feature setini referans alıyoruz ama klonlamıyoruz.

---

## 🧱 Tech Stack (Sabit — değiştirme)

| Katman | Teknoloji | Neden |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Server components + edge runtime |
| Dil | **TypeScript** (strict mode) | Tip güvenliği |
| Auth + DB | **Supabase** | Email/password auth + Postgres + RLS |
| Storage | **Cloudflare R2** | Egress ücreti yok, büyük 360 dosyaları için ideal |
| 360 Viewer | **Photo Sphere Viewer v5** | Plugin ekosistemi (hotspots, virtual tour, gyro, VR) |
| UI Kit | **shadcn/ui** + **Tailwind CSS** | Customizable, modern |
| İkon | **lucide-react** | Tutarlı, light/dark |
| Form | **react-hook-form** + **zod** | Validation |
| Data fetching | **TanStack Query** | Server state cache |
| State (UI) | **Zustand** | Lightweight, sadece gerektiğinde |
| Image processing | **sharp** (server-side) | Thumbnail / preview üretimi |

> ❌ Kullanma: Marzipano, Pannellum (yerlerine PSV), Firebase (yerine Supabase), AWS S3 (yerine R2), Material UI (yerine shadcn).

---

## 📂 Dosya Yapısı

```
/
├── CLAUDE.md                    ← bu dosya
├── docs/
│   ├── PRD.md                   ← ürün gereksinimleri ve feature listesi
│   ├── ARCHITECTURE.md          ← teknik mimari, klasör yapısı, data flow
│   ├── DATABASE.md              ← Supabase schema, RLS, migrasyonlar
│   ├── UI-UX.md                 ← tasarım sistemi, renkler, mobil davranış
│   └── ROADMAP.md               ← faz faz yapılacak işler
├── src/
│   ├── app/                     ← Next.js App Router
│   ├── components/              ← React komponentleri
│   ├── lib/                     ← yardımcılar (supabase, r2, utils)
│   ├── hooks/                   ← React hooks
│   └── types/                   ← TypeScript tipleri
├── supabase/
│   └── migrations/              ← SQL migrasyon dosyaları
└── public/
```

Detay için: `docs/ARCHITECTURE.md`

---

## 🚀 Geliştirme Sırası

**Mutlaka `docs/ROADMAP.md` sırasını takip et.** Faz atlamak yok. Her faz tamamlandığında:
1. Manuel test edilebilir bir sonuç olmalı
2. Mobil cihazda test edilmeli
3. Commit atılmalı

Şu anki faz: **Phase 0 — Setup** (sıfırdan başlıyoruz)

---

## 🎨 UI/UX Kuralları (kritik)

UI/UX bu projenin en önemli ayağı. Çünkü çıktısı görsel bir ürün (panorama showcase) ve müşterilere gidiyor.

- **Mobil-öncelikli tasarım.** Önce 375px (iPhone SE), sonra desktop. Hover-only etkileşim yok.
- **Dark mode default.** Panorama görselleri koyu zeminde çok daha iyi görünür.
- **`ui-ux-pro-max-skill` skillini kullan.** Bu skill yüklü; tüm UI üretiminde önce onu oku.
- **AI-generic görünmesin.** Tipik "Tailwind landing page" görüntüsünden kaçın. Detay için `docs/UI-UX.md`.
- **frontend-design skillini de oku** (built-in). CSS variable kuralları, tasarım token'ları orada.

---

## 🔐 Güvenlik

- `.env.local` **asla** commitlenmez. `.gitignore`'da olmalı.
- `SUPABASE_SERVICE_ROLE_KEY` ve `R2_SECRET_ACCESS_KEY` **sadece server-side** kullanılır (API routes, server actions). Client'a sızmamalı.
- Tüm tablo erişimleri **RLS (Row Level Security)** üzerinden yapılır. Service role key sadece migration ve admin işlemlerinde.
- R2 upload'ları **signed URL** ile yapılır — client'a secret access key verme.
- Public share linklerinde token bazlı erişim; opsiyonel parola desteği.

---

## 🛠️ Komutlar

```bash
# Geliştirme
npm run dev                 # localhost:3000
npm run build               # production build
npm run lint                # ESLint
npm run typecheck           # tsc --noEmit

# Supabase
npx supabase init           # ilk kurulum
npx supabase db push        # migrasyonları cloud'a gönder
npx supabase gen types typescript --linked > src/types/supabase.ts
```

---

## 📝 Kod Stili

- TypeScript strict. `any` kullanma — `unknown` ve narrow et.
- Server Components default; sadece etkileşim olan yerlerde `"use client"`.
- Async functions için `try/catch` + structured error (Discord/Slack'e log atılabilir yapıda).
- Form validation sadece zod schema ile. Aynı schema hem client hem server'da kullanılır.
- Tailwind class sırası: layout → spacing → sizing → typography → colors → effects.
- Bileşen dosyaları `kebab-case.tsx`, bileşen ismi `PascalCase`.
- Asla browser API'leri (localStorage, window) Server Component'te kullanma.

---

## ⚠️ Önceki Denemeden Çıkarımlar (sahibinin notu)

Sahip daha önce bu projeyi denemiş ama tamamlayamamış. Tipik tuzaklar:
1. **RLS policy'leri kurmadan ilerlemek** → her query 401 döner. İlk migration'da policy'ler yazılacak.
2. **Direkt API üzerinden büyük dosya yüklemek** → 4.5MB Vercel limiti yüzünden 360 görselleri (genelde 20-50MB) yüklenmez. **Signed URL ile direkt R2'ye upload.**
3. **R2 CORS'u unutmak** → browser'dan upload patlar. Setup adımlarında CORS yapılandırması var.
4. **Auth middleware'i unutmak** → session client'ta görünür ama server'da yok. `@supabase/ssr` paketi şart.
5. **PSV'yi SSR ile çalıştırmaya kalkmak** → `next/dynamic` ile `ssr: false`. Detay `ARCHITECTURE.md`.

---

## 📚 Referanslar

- Photo Sphere Viewer: https://photo-sphere-viewer.js.org/
- Supabase + Next.js (SSR): https://supabase.com/docs/guides/auth/server-side/nextjs
- Cloudflare R2: https://developers.cloudflare.com/r2/
- shadcn/ui: https://ui.shadcn.com/

---

## 🧭 Sonraki Adım

`docs/ROADMAP.md` dosyasını aç, **Phase 0 — Setup**'tan başla. Adımları sırayla uygula. Her adım sonunda sahibe doğrulama sor (özellikle Supabase/R2 hesap yapılandırması gerektiren adımlarda).
