# ARCHITECTURE.md — Teknik Mimari

## Genel Bakış

```
┌─────────────────────────────────────────────────────────────┐
│                       BROWSER (Client)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ Next.js Pages    │  │  Photo Sphere    │  │  Supabase  │ │
│  │ (RSC + Client)   │  │     Viewer       │  │  Client SDK│ │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               │ API calls            │ Direct PUT (upload)
               │ (HTTPS)              │ Direct GET (panorama image)
               ▼                      ▼
┌─────────────────────────┐   ┌──────────────────────┐
│  Next.js API Routes /   │   │   Cloudflare R2      │
│  Server Actions         │   │   (S3-compatible)    │
│  (Vercel Edge/Node)     │   │   - panoramas/       │
│  - /api/uploads/sign    │   │   - thumbnails/      │
│  - /api/panoramas       │   │   - covers/          │
│  - /api/analytics       │   └──────────────────────┘
│  - /api/share           │
└────────────┬────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│       Supabase (Cloud)               │
│  ┌──────────┐  ┌──────────────────┐  │
│  │  Auth    │  │   Postgres + RLS │  │
│  │ (JWT)    │  │   - profiles     │  │
│  └──────────┘  │   - projects     │  │
│                │   - panoramas    │  │
│                │   - hotspots     │  │
│                │   - shares       │  │
│                │   - analytics    │  │
│                └──────────────────┘  │
└──────────────────────────────────────┘
```

---

## Klasör Yapısı (Detaylı)

```
/
├── src/
│   ├── app/
│   │   ├── (auth)/                       # Public auth sayfaları
│   │   │   ├── login/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx                # Minimal layout
│   │   │
│   │   ├── (dashboard)/                  # Auth gerektiren
│   │   │   ├── layout.tsx                # Sidebar + topbar
│   │   │   ├── page.tsx                  # Dashboard ana sayfa
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx              # Proje listesi
│   │   │   │   ├── new/page.tsx          # Yeni proje
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # Proje detay
│   │   │   │       ├── edit/page.tsx     # Tour editor
│   │   │   │       └── analytics/page.tsx
│   │   │   ├── users/                    # (admin only) Müşteri yönetimi
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── v/[token]/                    # Public share viewer
│   │   │   ├── page.tsx
│   │   │   └── password/page.tsx         # Parola gerekiyorsa
│   │   │
│   │   ├── embed/[token]/                # iframe embed viewer
│   │   │   └── page.tsx                  # Minimal UI
│   │   │
│   │   ├── api/
│   │   │   ├── uploads/
│   │   │   │   ├── sign/route.ts         # R2 signed URL üret
│   │   │   │   └── complete/route.ts     # Upload bitti kaydı
│   │   │   ├── panoramas/
│   │   │   │   ├── route.ts              # CRUD
│   │   │   │   └── [id]/route.ts
│   │   │   ├── hotspots/route.ts
│   │   │   ├── analytics/
│   │   │   │   ├── ingest/route.ts       # Event ingestion
│   │   │   │   └── query/route.ts        # Dashboard sorguları
│   │   │   ├── share/
│   │   │   │   ├── route.ts              # Share oluştur
│   │   │   │   └── verify/route.ts       # Parola doğrula
│   │   │   └── auth/
│   │   │       └── callback/route.ts     # Supabase auth callback
│   │   │
│   │   ├── layout.tsx                    # Root layout (theme, fonts)
│   │   ├── globals.css                   # Tailwind + CSS vars
│   │   └── middleware.ts                 # Auth refresh + route protection
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn primitives
│   │   ├── auth/                         # Login form, vs.
│   │   ├── projects/                     # ProjectCard, ProjectList
│   │   ├── viewer/
│   │   │   ├── panorama-viewer.tsx       # PSV wrapper (client comp)
│   │   │   ├── tour-editor.tsx           # Hotspot editor
│   │   │   ├── hotspot-marker.tsx
│   │   │   └── viewer-controls.tsx
│   │   ├── upload/
│   │   │   ├── upload-dropzone.tsx
│   │   │   └── upload-queue.tsx
│   │   ├── analytics/
│   │   │   ├── stat-card.tsx
│   │   │   ├── view-chart.tsx
│   │   │   └── device-breakdown.tsx
│   │   └── shared/                       # Header, sidebar, layout parts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   ├── server.ts                 # Server client (with cookies)
│   │   │   ├── admin.ts                  # Service role (server only)
│   │   │   └── middleware.ts             # Refresh session
│   │   ├── r2/
│   │   │   ├── client.ts                 # S3 client config
│   │   │   ├── sign.ts                   # presigned URL üretimi
│   │   │   └── cors.ts                   # CORS yapılandırma helper
│   │   ├── analytics/
│   │   │   ├── tracker.ts                # Client-side event tracker
│   │   │   └── aggregate.ts              # Server-side aggregation
│   │   ├── auth/
│   │   │   └── permissions.ts            # Role checks
│   │   ├── validation/                   # Zod schemas
│   │   │   ├── project.ts
│   │   │   ├── panorama.ts
│   │   │   └── hotspot.ts
│   │   └── utils.ts                      # cn() vb.
│   │
│   ├── hooks/
│   │   ├── use-user.ts
│   │   ├── use-projects.ts
│   │   └── use-upload.ts
│   │
│   ├── types/
│   │   ├── supabase.ts                   # generated
│   │   ├── domain.ts                     # Project, Panorama, Hotspot
│   │   └── psv.ts                        # PSV plugin tipleri
│   │
│   └── styles/
│       └── tokens.css                    # CSS custom properties
│
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql
│       ├── 0002_rls_policies.sql
│       ├── 0003_analytics.sql
│       └── 0004_triggers.sql
│
├── public/
│   ├── favicon.ico
│   ├── og-default.png
│   └── icons/
│
├── .env.local                            # GITIGNORED
├── .env.example                          # Template (no secrets)
├── next.config.ts
├── tailwind.config.ts
├── components.json                       # shadcn config
├── tsconfig.json
└── package.json
```

---

## Data Flow

### Auth Flow

```
1. Kullanıcı /login'de email + password girer
2. supabase-js → POST /auth/v1/token (Supabase)
3. Supabase JWT döner → middleware cookie'ye yazar (httpOnly, secure)
4. Sonraki request'lerde middleware cookie'yi okur, session'ı refresh eder
5. Server Component'lerde createServerClient() ile auth.getUser()
6. /dashboard altı middleware'de korunur — login yoksa /login'e yönlendir
```

**Kritik:** `@supabase/ssr` paketi kullanılacak. `@supabase/auth-helpers-nextjs` **deprecated**, kullanma.

### Upload Flow (büyük panorama dosyaları için)

```
1. Client: file seçer (50MB equirectangular JPG)
2. Client: POST /api/uploads/sign
   { fileName, fileType, fileSize, projectId }
3. Server: 
   - Auth check (kullanıcı bu projeye yazabilir mi?)
   - Boyut/MIME kontrolü
   - R2 için presigned PUT URL üret (15dk geçerli)
   - DB'ye "uploading" durumda panorama kaydı ekle
   - { uploadUrl, panoramaId } döner
4. Client: PUT uploadUrl (direkt R2'ye, progress event'leriyle)
5. Client: PUT bitince → POST /api/uploads/complete { panoramaId }
6. Server:
   - R2'de dosyanın var olduğunu doğrula (HEAD request)
   - Sharp ile thumbnail üret (1024x512 webp) → R2'ye yükle
   - Panorama kaydını "ready" yap
7. Client: ekranı refresh et, panorama listesinde göster
```

**Neden direkt R2?** Vercel serverless function'ların 4.5MB body limiti var. 50MB dosya geçmez. Cloudflare R2 S3-compatible olduğu için AWS SDK ile presign edilebilir.

### Analytics Ingestion

```
1. Viewer açılırken: PSV "ready" eventi → tracker.startSession()
2. Tracker:
   - Cookie'den session_id oku (yoksa üret + 1 yıl cookie)
   - POST /api/analytics/ingest { event: "view_start", ... } (sendBeacon ile)
3. Panorama değişince: tracker.trackEvent("panorama_change", ...)
4. Sayfa kapanırken (visibilitychange): tracker.endSession()
   - duration hesaplanır, beacon ile gönderilir
5. Server: event'leri raw tabloya yazar
6. Cron (Supabase Edge Function, opsiyonel): günde 1 kez aggregate tablosuna özetle
```

**IP → Country:** Vercel/Cloudflare header'ları (`x-vercel-ip-country`, `cf-ipcountry`) — geolocation servisi gerekmez.

### Public Viewer Flow

```
1. /v/{token} açılır
2. Server:
   - shares tablosunda token bul, expires_at + password kontrol
   - Parolalı ise: /v/{token}/password'a yönlendir
   - Sorun yoksa: project + panoramas + hotspots fetch et (RLS bypass için service role gerekebilir, ama public token'la zaten yetkili)
3. Sayfa render edilir, PSV başlar
4. Analytics tracker session başlatır
```

---

## Photo Sphere Viewer Entegrasyonu

PSV **Three.js** kullanır, sadece client-side çalışır.

```tsx
// src/components/viewer/panorama-viewer.tsx
"use client";

import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
// ... etc

// SSR'da yüklenmesin
```

Parent'tan **dynamic import** ile çağırılır:

```tsx
// src/app/v/[token]/page.tsx
import dynamic from "next/dynamic";
const PanoramaViewer = dynamic(() => import("@/components/viewer/panorama-viewer"), { ssr: false });
```

**Plugin konfigürasyonu** projeye özgü; her panoramanın hotspot'ları markers olarak verilir, panorama geçişleri VirtualTourPlugin'in `nodes` arrayına maplenir.

---

## R2 Bucket Yapısı

```
360drone/                         (bucket name)
├── panoramas/
│   └── {projectId}/{panoramaId}.jpg
├── thumbnails/
│   └── {projectId}/{panoramaId}.webp     (1024x512)
├── covers/
│   └── {projectId}.jpg                    (proje kapak)
└── assets/
    └── hotspot-icons/                     (custom hotspot iconları)
```

### CORS Konfigürasyonu (kritik)

Wrangler veya R2 dashboard üzerinden:

```json
[
  {
    "AllowedOrigins": [
      "https://your-domain.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### R2 Public URL (Custom Domain)

Performans için R2 bucket'a custom domain bağlanır (`cdn.your-domain.com`). Public panorama URL'leri böylelikle Cloudflare CDN üzerinden gelir. Setup adımlarında dahil.

---

## Environment Variables

```bash
# .env.local (development)
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://koxdkmzruafkbxayvrei.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_F5-EmiyyGs5_AAgJ-fIDxg_9C5SW-nq
SUPABASE_SERVICE_ROLE_KEY=...      # ⚠️ ROTATE — eski olan chat'te paylaşıldı

# Cloudflare R2
R2_ACCOUNT_ID=2b713669f4eb44a45d80dcec73cc138b
R2_ACCESS_KEY_ID=...               # ⚠️ ROTATE
R2_SECRET_ACCESS_KEY=...           # ⚠️ ROTATE
R2_BUCKET_NAME=360drone
R2_ENDPOINT=https://2b713669f4eb44a45d80dcec73cc138b.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://cdn.your-domain.com   # custom domain (kurulduğunda)

# Admin
ADMIN_EMAIL=tasarim@cihanduran.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # production'da değişir
```

`.env.example` dosyası bu yapıyı boş değerlerle taşır, repo'ya commitlenir.

---

## Performans Hedefleri

- İlk panorama yüklenme süresi (mobil 4G): **< 5s**
- Lighthouse mobile score: **≥ 90**
- Time to Interactive: **< 3s** (dashboard sayfaları)
- 360 viewer frame rate (mid-range Android): **≥ 30 FPS**

### Optimizasyonlar

1. **Panorama image resizing:** Yüklenince sharp ile 4K (4096x2048) ve 2K (2048x1024) versiyonlar üretilir. Mobil 2K alır, desktop 4K.
2. **Multi-resolution tiling** (Phase 2): 8K+ panoramalar için PSV cubemap tiles ile chunked load.
3. **Lazy loading:** PSV sadece görünür olduğunda init edilir (Intersection Observer).
4. **HTTP/2 + Cloudflare CDN:** R2 zaten Cloudflare üzerinde, custom domain ile cache aktif.
5. **Next.js Server Components:** Dashboard list view'ları RSC, viewer client.

---

## Error Handling Stratejisi

- API route'lar **standart error shape**:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }
  ```
- Client'ta TanStack Query `onError` ile toast (`sonner`)
- Server'da `console.error` + (faz 2) Sentry
- Form hataları zod issue'larından çevrilir, field-level gösterilir

---

## Mobile-First Mimari Notlar

- **PWA manifest** ekle (`manifest.json`) — homescreen'e ekleme
- **Service worker** (Phase 2) — offline cache (zaten görüntülenen panorama'lar)
- Viewer container `100dvh` kullanır (`100vh` mobil tarayıcılarda bug yapar)
- Tüm modal/drawer'lar `vaul` ile mobilde bottom sheet, desktopta center modal
- Touch event'ler için `touch-action: none` viewer container'da
