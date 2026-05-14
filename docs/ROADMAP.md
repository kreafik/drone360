# ROADMAP.md — Fazlı Geliştirme Planı

> Her faz tamamlanmadan sonrakine geçme. Her fazın sonunda **manuel olarak test edilebilir, çalışan bir şey** olacak.

---

## ⚙️ Phase 0 — Setup (Tahmini: 30-60 dk)

### Adımlar

1. **Next.js projesini kur**
   ```bash
   npx create-next-app@latest drone360 --typescript --tailwind --app --src-dir --turbopack
   cd drone360
   ```
   - ESLint: evet
   - Tailwind: evet
   - App Router: evet
   - Import alias: `@/*`

2. **Bağımlılıkları yükle**
   ```bash
   # Auth & DB
   npm install @supabase/supabase-js @supabase/ssr

   # Storage
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

   # 360 Viewer
   npm install @photo-sphere-viewer/core @photo-sphere-viewer/markers-plugin \
               @photo-sphere-viewer/virtual-tour-plugin @photo-sphere-viewer/gyroscope-plugin \
               @photo-sphere-viewer/autorotate-plugin

   # Forms
   npm install react-hook-form zod @hookform/resolvers

   # Data fetching
   npm install @tanstack/react-query

   # UI
   npm install lucide-react class-variance-authority clsx tailwind-merge
   npm install sonner vaul

   # State
   npm install zustand

   # Image processing (server)
   npm install sharp

   # Dev tools
   npm install -D @types/node prettier prettier-plugin-tailwindcss
   ```

3. **shadcn/ui kur**
   ```bash
   npx shadcn@latest init
   # Style: New York, Base color: Neutral, CSS variables: yes
   ```
   Başlangıç bileşenleri:
   ```bash
   npx shadcn@latest add button input label form card dialog dropdown-menu \
                            avatar tabs select textarea sonner skeleton tooltip badge
   ```

4. **`.env.local` oluştur** — `ARCHITECTURE.md` "Environment Variables" bölümünden kopyala.
   - **Önemli:** Kullanıcı eski credential'ları rotate etmiş olmalı. Onaylat.

5. **`.gitignore` kontrolü** — `.env.local`, `.env*.local`, `/.next`, `/node_modules` olmalı.

6. **Supabase projesini bağla**
   ```bash
   npx supabase init
   npx supabase link --project-ref koxdkmzruafkbxayvrei
   ```

7. **CSS tokens'ı kur** — `src/app/globals.css` dosyasını `UI-UX.md` "CSS Variables" bölümünden güncelle.

8. **Tailwind config** — dark mode default. `tailwind.config.ts` veya `globals.css` `@theme` ile.

9. **Klasör yapısını oluştur** (boş dosyalar) — `ARCHITECTURE.md` "Klasör Yapısı"ndan.

### ✅ Phase 0 Bitti mi?
- [ ] `npm run dev` çalışıyor
- [ ] localhost:3000 açılıyor, default sayfa görünüyor
- [ ] Tailwind dark renkler aktif (background siyaha yakın)
- [ ] shadcn Button mount edilmiş örnek sayfa var

**Test:** `/` ana sayfaya bir `<Button>Test</Button>` koy. Render olmalı, warm-amber renk olmalı.

---

## 🔐 Phase 1 — Auth + Database (Tahmini: 2-3 saat)

### Adımlar

1. **Supabase migration'ları yaz** — `DATABASE.md`'den 0001, 0002, 0003 SQL'lerini ilgili dosyalara koy:
   ```
   supabase/migrations/
   ├── 0001_init.sql
   ├── 0002_rls_policies.sql
   └── 0003_analytics.sql
   ```

2. **Push et**
   ```bash
   npx supabase db push
   ```
   - Hata olursa Supabase Studio'da SQL Editor'da manuel çalıştır.

3. **Admin email ayarla** (Supabase Studio → SQL Editor):
   ```sql
   ALTER DATABASE postgres SET app.admin_email = 'tasarim@cihanduran.com';
   ```

4. **Admin user yarat** (Supabase Studio → Auth → Users → Invite User):
   - Email: `tasarim@cihanduran.com`
   - Otomatik magic link gelir, parola belirle.
   - Trigger sayesinde `profiles` tablosuna `role='admin'` olarak yazılır. Kontrol et:
     ```sql
     select * from profiles;
     ```

5. **TypeScript tipleri üret**
   ```bash
   npx supabase gen types typescript --linked > src/types/supabase.ts
   ```

6. **Supabase client'ları kur**
   - `src/lib/supabase/client.ts` (browser)
   - `src/lib/supabase/server.ts` (server with cookies)
   - `src/lib/supabase/admin.ts` (service role, sadece API routes'tan)
   - Resmi dokümantasyon: https://supabase.com/docs/guides/auth/server-side/nextjs

7. **Middleware kur** — `src/middleware.ts`:
   - Session refresh
   - `/dashboard/*` → unauthenticated user'ı `/login`'e yönlendir
   - `/login` → authenticated user'ı `/dashboard`'a yönlendir

8. **Login sayfasını yap** — `/login`:
   - shadcn Form + react-hook-form + zod
   - Email + password input
   - "Giriş Yap" butonu
   - "Şifremi unuttum" linki
   - Login başarılı → `/dashboard`'a yönlendir (router.push + refresh)
   - **UI-UX.md kurallarına uy.** Boş, editorial, max-w-md center.

9. **Forgot password sayfası** — `/forgot-password`:
   - Email input → `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`
   - Confirmation message

10. **Auth callback route** — `/api/auth/callback/route.ts`:
    - Magic link / OAuth flow için (forgot password reset link tıklandığında).

11. **Dashboard shell** — `/dashboard`:
    - `(dashboard)/layout.tsx` — sidebar + topbar
    - Sidebar: Projeler, (admin ise) Kullanıcılar, Ayarlar, Çıkış
    - Topbar: user avatar + dropdown
    - Boş dashboard sayfası: "Hoş geldin {name}" + 3 stat card placeholder.

12. **Logout** — `supabase.auth.signOut()` + router.refresh.

### ✅ Phase 1 Bitti mi?
- [ ] `/login` çalışıyor, hatalı şifre kırmızı uyarı veriyor
- [ ] Doğru şifreyle giriş yapınca `/dashboard`'a düşüyor
- [ ] Logout çalışıyor, `/dashboard`'a anonim girilemiyor
- [ ] Profile tablosunda admin user `role='admin'` ile var
- [ ] Mobil Safari/Chrome'da test edildi, layout bozulmuyor

---

## 📦 Phase 2 — Proje CRUD (Tahmini: 3-4 saat)

### Adımlar

1. **Proje validation schema** — `src/lib/validation/project.ts`:
   ```ts
   export const projectSchema = z.object({
     title: z.string().min(2).max(100),
     description: z.string().max(500).optional(),
     type: z.enum(['real_estate', 'boat', 'other']),
     location: z.string().max(200).optional(),
     ownerId: z.string().uuid(),  // admin seçer
   });
   ```

2. **Kullanıcı listesi (admin only)** — `/dashboard/users`:
   - Tablo: email, full_name, company_name, role, created_at
   - "Yeni Müşteri" butonu → `/dashboard/users/new`:
     - Email + full_name + company_name + send_invite checkbox
     - API route `/api/users/invite` — Supabase admin SDK ile `inviteUserByEmail`
   - Müşteri detay: atanmış projeler listesi.

3. **Proje listesi** — `/dashboard/projects`:
   - Admin: tüm projeler, filter (sahip, tür, durum)
   - Client: kendi projeleri
   - **ProjectCard** komponenti: kapak görseli (yoksa placeholder), başlık, type badge, status badge, son güncelleme
   - "Yeni Proje" butonu (sadece admin)
   - Empty state (UI-UX.md kurallarıyla)

4. **Yeni proje** — `/dashboard/projects/new`:
   - Form: title, description (textarea), type (select), location, owner (admin için select, client için kendisi)
   - Submit → Server Action ile insert → `/dashboard/projects/{id}`'e yönlendir

5. **Proje detay** — `/dashboard/projects/[id]`:
   - Header: başlık + status badge + actions (Düzenle, Yayınla/Taslak, Paylaş, Sil)
   - Tabs: **Panoramalar** | **Hotspot Editörü** | **Analitik** | **Paylaşım**
   - "Panoramalar" tab Phase 3'te dolacak.

6. **Proje düzenle** — modal veya inline edit. Sadece form alanları.

7. **Soft delete** — confirmation dialog (shadcn AlertDialog).

### ✅ Phase 2 Bitti mi?
- [ ] Admin yeni proje oluşturabiliyor
- [ ] Listede görünüyor, detay sayfası açılıyor
- [ ] Admin müşteri oluşturup ona proje atayabiliyor
- [ ] Client login olunca sadece kendi projelerini görüyor
- [ ] RLS test: client başka client'ın projesini URL ile açmaya çalışırsa 404 / 403

---

## 📤 Phase 3 — R2 Upload + Panorama Listesi (Tahmini: 4-5 saat)

### Adımlar

1. **R2 CORS'unu yapılandır** — Cloudflare R2 dashboard → bucket → Settings → CORS:
   ```json
   [{
     "AllowedOrigins": ["http://localhost:3000", "https://your-prod-domain.com"],
     "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
     "AllowedHeaders": ["*"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3600
   }]
   ```

2. **R2 client kur** — `src/lib/r2/client.ts`:
   ```ts
   import { S3Client } from "@aws-sdk/client-s3";
   export const r2 = new S3Client({
     region: "auto",
     endpoint: process.env.R2_ENDPOINT!,
     credentials: {
       accessKeyId: process.env.R2_ACCESS_KEY_ID!,
       secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
     },
   });
   ```

3. **Signed URL API** — `POST /api/uploads/sign`:
   - Auth check + admin only
   - Body: `{ projectId, fileName, fileType, fileSize }`
   - File size validation (max 50MB), MIME check (jpeg/jpg/webp)
   - Yeni panorama id üret, R2 key: `panoramas/{projectId}/{panoramaId}.jpg`
   - `getSignedUrl(r2, new PutObjectCommand({...}), { expiresIn: 900 })`
   - DB: `panoramas` tablosuna `status='uploading'` kaydı ekle
   - Response: `{ panoramaId, uploadUrl, key }`

4. **Upload complete API** — `POST /api/uploads/complete`:
   - Body: `{ panoramaId }`
   - R2'de HEAD ile dosyanın var olduğunu doğrula
   - Sharp ile thumbnail üret:
     ```ts
     // R2'den indir → sharp().resize(1024,512).webp() → R2'ye yükle
     ```
   - DB güncelle: `status='ready'`, `width`, `height`, `file_size`, `thumbnail_key`

5. **Upload UI** — `src/components/upload/upload-dropzone.tsx`:
   - Native HTML5 drag-drop (külli kütüphane gereksiz)
   - Multi-file support
   - Her dosya için ayrı progress bar
   - Sıra: select → validate (2:1 oran client-side) → sign → PUT to R2 (XHR for progress) → complete API → toast
   - Error handling: her aşamada kullanıcıya net mesaj

6. **Panoramalar tab'i** — `/dashboard/projects/[id]` içinde:
   - Grid layout: panorama thumbnail kartları
   - Her kart: thumbnail, başlık, drag handle, edit/delete butonlar
   - "Panorama Ekle" butonu → upload modal
   - Drag-and-drop reorder (`@dnd-kit/sortable`) — position kolonu güncellenir

7. **Panorama düzenle** — başlık değiştir, varsayılan görüş açısı ayarla (PSV içinde "save view" butonu — Phase 4 ile birlikte gelecek).

### ✅ Phase 3 Bitti mi?
- [ ] 20MB+ bir panorama yüklenebiliyor
- [ ] Upload sırasında progress bar çalışıyor
- [ ] Yükleme sonrası thumbnail otomatik oluşmuş
- [ ] R2 bucket'ta dosyalar görünüyor (panoramas/ ve thumbnails/)
- [ ] Drag-drop ile sıralama değişiyor ve DB'ye kaydediliyor
- [ ] Hatalı dosya (PNG, 100MB, dikey) net hata mesajıyla reddediliyor

---

## 🌍 Phase 4 — 360 Viewer (Tahmini: 4-5 saat)

### Adımlar

1. **PSV wrapper component** — `src/components/viewer/panorama-viewer.tsx`:
   - `"use client"`, dynamic import için ayrı dosya
   - Props: `{ panoramas: Panorama[], initialId?: string, mode: "view" | "edit", onHotspotClick?, onPanoramaChange?, onCameraChange? }`
   - PSV init + plugins (`MarkersPlugin`, `VirtualTourPlugin`, `GyroscopePlugin`, `AutorotatePlugin`)
   - VirtualTour `nodes` array'ini panoramalardan üret, links hotspot'lardan
   - Cleanup: `viewer.destroy()` unmount'ta

2. **Viewer wrapper sayfası** — `/dashboard/projects/[id]/view`:
   - Server'da project + panoramas + hotspots fetch
   - `<PanoramaViewer>` render
   - Üst bar: proje başlığı, "Editöre dön" butonu
   - Alt bar: panorama selector (mini kartlar)
   - Sağ alt: kontroller (fullscreen, VR, autorotate, share)

3. **Public viewer** — `/v/[token]/page.tsx`:
   - Service role client ile share token doğrula
   - Parolalı ise → password sayfasına yönlendir
   - Project + panoramas + hotspots fetch
   - Aynı `<PanoramaViewer>` render, ama farklı overlay (logo + brand)
   - Analytics tracker başlat

4. **Password sayfası** — `/v/[token]/password`:
   - Input + submit → `POST /api/share/verify` → cookie set → redirect to `/v/[token]`

5. **Embed sayfası** — `/embed/[token]/page.tsx`:
   - Minimal layout, sadece viewer
   - X-Frame-Options: ALLOWALL (next.config.ts headers)
   - PostMessage ile parent'a event'ler bildir (opsiyonel, faz 5)

6. **Hotspot editor** — proje detayında "Hotspot Editörü" tab:
   - `<PanoramaViewer mode="edit" />`
   - Sahnede tıkla → yaw/pitch yakala → modal aç → hotspot tipi seç
   - Link hotspot için: hedef panorama seçici (dropdown veya thumbnail picker)
   - Info hotspot için: başlık, açıklama, opsiyonel görsel URL
   - Sağ panel: mevcut hotspot listesi, edit/delete

7. **Default view ayarı** — viewer'da "Bu görünümü varsayılan yap" butonu:
   - PSV `getPosition()` çağır, `default_yaw/pitch/zoom` güncelle.

### ✅ Phase 4 Bitti mi?
- [ ] Viewer mobilde sorunsuz açılıyor, pan/zoom/gyro çalışıyor
- [ ] Panoramalar arası geçiş smooth
- [ ] Hotspot eklenip kaydedilebiliyor, yeniden açıldığında doğru konumda
- [ ] Public share link'e Incognito'dan giriş → tur çalışıyor
- [ ] Embed iframe başka bir sitede çalışıyor (test için codepen veya local html)

---

## 🔗 Phase 5 — Sharing + Embed (Tahmini: 2 saat)

### Adımlar

1. **Share oluşturma UI** — proje detayında "Paylaşım" tab:
   - Mevcut share'leri listele
   - "Yeni Paylaşım Oluştur" → modal:
     - Opsiyonel parola
     - Opsiyonel expiry date
     - Submit → `POST /api/share` → token döner
   - Link kopyala butonu (`navigator.clipboard`)
   - Embed kodu kopyala (`<iframe src="..."></iframe>`)
   - "Devre dışı bırak" toggle (`is_active` false)

2. **Share verification API** — `POST /api/share/verify`:
   - Body: `{ token, password }`
   - bcrypt.compare → match ise cookie set
   - Cookie: `share_{token}_verified=1`, httpOnly, 7 gün

3. **OG meta tags** — `/v/[token]/page.tsx` `generateMetadata`:
   - title: proje başlığı
   - description: proje açıklaması
   - openGraph.images: proje kapak görseli
   - twitter:card summary_large_image

### ✅ Phase 5 Bitti mi?
- [ ] Parolasız share Incognito'da çalışıyor
- [ ] Parolalı share önce parola sorup sonra açılıyor
- [ ] Embed kodu kopyalanıp test sitesinde çalışıyor
- [ ] WhatsApp/Twitter paylaşımında preview kart düzgün görünüyor

---

## 📊 Phase 6 — Analytics (Tahmini: 3-4 saat)

### Adımlar

1. **Tracker client** — `src/lib/analytics/tracker.ts`:
   - `startSession(projectId, panoramaId, shareId?)` — cookie set, view_start beacon
   - `trackEvent(type, data)` — beacon
   - `endSession()` — duration hesapla, view_end beacon
   - `visibilitychange` listener
   - `sendBeacon` ile gönderim (sayfa kapansa da gider)

2. **Ingest API** — `POST /api/analytics/ingest`:
   - Body validation
   - IP → country: Vercel header `x-vercel-ip-country` (production) veya fallback "XX"
   - User-Agent parse: device_type, browser, os (basit regex veya `ua-parser-js`)
   - Insert into `analytics_events`
   - Response 204 (no content, beacon için ideal)

3. **Viewer'a tracker entegrasyonu**:
   - `<PanoramaViewer>` içinde `useEffect` ile tracker init
   - Panorama change → trackEvent("panorama_change", ...)
   - Hotspot click → trackEvent("hotspot_click", ...)
   - Fullscreen, VR, autorotate → ilgili eventler

4. **Analytics dashboard** — `/dashboard/projects/[id]/analytics`:
   - Stat cards: Toplam görüntülenme, Tekil ziyaretçi, Ort. süre, Hotspot click
   - Tarih aralığı selector (7/30 gün, custom)
   - Chart: günlük görüntülenme (`recharts` veya `tremor`)
   - Tablolar: ülke dağılımı, cihaz dağılımı, en popüler panoramalar, trafik kaynağı
   - Sorgular API üzerinden (`/api/analytics/query?projectId=...&range=...`)

5. **Genel dashboard** — `/dashboard` ana sayfa (admin için):
   - Toplam proje sayısı
   - Bu ay yeni görüntülenme
   - En aktif 5 proje
   - Son 7 gün trend chart

### ✅ Phase 6 Bitti mi?
- [ ] Bir share linkini Incognito'da açınca analytics_events'e satır düşüyor
- [ ] Birden fazla session unique visitor olarak sayılıyor
- [ ] Dashboard'da grafik ve tablolar dolu
- [ ] Mobilde analytics dashboard responsive (chart taşmıyor)

---

## ✨ Phase 7 — Polish & Production (Tahmini: 2-3 saat)

### Adımlar

1. **R2 Custom Domain** — `cdn.your-domain.com` Cloudflare'de bucket'a bağlanır. `R2_PUBLIC_URL` env güncellenir. Tüm panorama URL'leri bu domain üzerinden.

2. **SEO basics**:
   - `robots.txt`: `/dashboard/*` ve `/v/*` disallow (privacy)
   - `sitemap.xml`: sadece public sayfalar (yoksa atla)

3. **404 / 500 pages** — `not-found.tsx` ve `error.tsx`. UI-UX.md empty state pattern'i ile.

4. **Loading states** — her route için `loading.tsx`.

5. **Error boundaries** — RootError boundary + dashboard altında ayrı.

6. **PWA manifest** — `public/manifest.json`, theme color, icons. Phone homescreen'e eklenebilir.

7. **OG image generator** — `app/v/[token]/opengraph-image.tsx` Next.js native ile dinamik.

8. **Performance**:
   - Lighthouse mobile audit, ≥ 90 hedef
   - Image optimization (Next.js Image her yerde)
   - Font subsetting (`next/font/google`)

9. **Deploy to Vercel**:
   - Env variables Vercel dashboard'da
   - Custom domain bağla
   - Supabase Auth redirect URL'lerini güncelle (Production URL)
   - R2 CORS'a production domain ekle

10. **Smoke test** — production'da tüm akışları manuel test et:
    - Login → proje oluştur → panorama yükle → hotspot ekle → share oluştur → Incognito'dan aç → analytics gör

### ✅ Phase 7 Bitti mi?
- [ ] Production URL'de tüm akışlar çalışıyor
- [ ] Lighthouse mobile Performance ≥ 90
- [ ] Custom domain üzerinden viewer açılıyor
- [ ] WhatsApp'a link paylaşınca preview kartı çıkıyor
- [ ] Sahip kendi telefonundan 5 dk içinde yeni bir tur oluşturup paylaşabiliyor

---

## 🚀 Sonrası (Phase 8+)

Bunlar MVP sonrası, **kesin yapılacak demek değil:**

- White-label branding (per-client logo + renkler)
- Custom domain per client (`tour.musteri.com`)
- Lead capture form
- Floor plan / mini-map (`Plan` plugin PSV)
- Multi-language (i18n) — şimdilik sadece Türkçe
- Native mobil app — gerekirse Expo + WebView
- Real-time co-viewing
- Stripe ile subscription (eğer müşterilere doğrudan satılacaksa)

---

## 📌 Genel Kurallar (Her Faz İçin)

1. **Her commit öncesi:** `npm run lint && npm run typecheck`.
2. **Her component yeni eklenince:** UI-UX.md ve `ui-ux-pro-max-skill` ile karşılaştır.
3. **Her API route'tan önce:** Auth check + zod validation.
4. **Her DB write'tan önce:** RLS policy'i doğrula (RLS pass etmiyorsa, ya policy yanlış ya da yapı yanlış — service role workaround değil).
5. **Mobil test:** Her fazın sonunda iPhone Safari + Android Chrome.
6. **Sahip onayı:** Belirsizlik anlarında (renk seçimi, akış tercihi, third-party kütüphane) sahibe sor.
