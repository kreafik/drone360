# UI-UX.md — Tasarım Sistemi ve Görsel Kurallar

> Bu doküman tek bir hedefe hizmet eder: **AI-generic görünmeyen, mobilde kusursuz, 360° içeriği öne çıkaran bir arayüz.**

---

## Önce Bunları Oku

Claude Code, herhangi bir UI komponenti üretmeden önce mutlaka şu kaynaklara dan:

1. **`ui-ux-pro-max-skill`** — kullanıcı tarafından yüklenmiş skill. Component pattern'leri, anti-pattern'ler ve estetik kuralları burada. **HER yeni component için önce bu skill'i view et.**
2. **`frontend-design` (built-in skill)** — `/mnt/skills/public/frontend-design/SKILL.md`. CSS variables, design tokens, environment-specific constraints.

Bu dokümanın altındaki kurallar bu iki skille çelişirse, **skill'ler kazanır.**

---

## 🎯 Tasarım Felsefesi

### Bu proje neye benzemesin?
- Generic "Tailwind UI" template'i (mavi → mor gradient, lucide icons, gri background)
- Bootstrap-style admin dashboard
- Stock SaaS landing page
- "ChatGPT'ye yaptırılmış" hissi veren her şey

### Neye benzesin?
- **Editorial.** Apple'ın ürün sayfaları gibi geniş alan, az ama kuvvetli typo, içeriğe nefes aldıran kompozisyon.
- **Cinematic.** 360 içerik medya. Galerilerde sergilenir gibi gösterilsin. Linear ve Vercel'in dashboard'ları gibi koyu, ortamı tüketmeyen UI.
- **Tactile mobile.** iOS sistem UI'ı kadar hassas. Tap target ≥ 44px. Haptic-feel transitions.

### Ton
- Türkçe içerik ama "samimi-profesyonel" — `Sen` veya `Siz`? Default **`Siz`**, müşterilere giden yer çünkü. Form helper text'lerinde kısa, direkt.
- Emoji kullanma. İkonlar lucide-react'tan.

---

## 🎨 Renk Paleti

**Dark mode default.** Light mode opsiyonel (Phase 2). 360 görseller koyu zeminde patlar.

### CSS Variables (Tailwind v4 syntax)

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Surface — yüzeyler */
  --color-background: oklch(0.13 0.01 240);        /* ana zemin: çok koyu, mavi-gri tonlu */
  --color-surface: oklch(0.17 0.012 240);          /* kartlar */
  --color-surface-elevated: oklch(0.21 0.014 240); /* modal, popover */
  --color-border: oklch(0.27 0.012 240);
  --color-border-strong: oklch(0.38 0.012 240);

  /* Foreground — yazılar */
  --color-foreground: oklch(0.96 0.005 240);
  --color-muted: oklch(0.68 0.012 240);
  --color-subtle: oklch(0.50 0.012 240);

  /* Accent — birincil aksiyon. AI-generic mavi DEĞİL.
     Sıcak-amber. Drone/golden hour vibe. */
  --color-accent: oklch(0.78 0.16 70);             /* warm amber/gold */
  --color-accent-hover: oklch(0.72 0.17 70);
  --color-accent-foreground: oklch(0.15 0.02 70);

  /* Semantic */
  --color-success: oklch(0.72 0.16 145);
  --color-warning: oklch(0.78 0.16 80);
  --color-danger: oklch(0.65 0.22 25);
  --color-info: oklch(0.72 0.12 230);

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  /* Fonts */
  --font-sans: "Inter", "Geist", system-ui, sans-serif;
  --font-display: "Instrument Serif", "Playfair Display", Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

> **Neden warm amber accent?** Tipik tech mavisinden kaçınmak için. Drone golden-hour çekimleri, gün batımı tekne fotoğrafları... ısı tonu marka kimliğine doğal oturuyor.

> **Neden OKLCH?** Renkler algısal olarak tutarlı, light/dark eklerken işin kolay.

---

## ✍️ Typography

İki font ailesi kullan, üç değil:

1. **Sans (Inter veya Geist):** Tüm UI, body, form, navigation.
2. **Display serif (Instrument Serif):** Sadece **proje başlıkları**, **hero metinleri**, **boş durum ekranları**. Editorial dokunuş.

```html
<h1 class="font-display text-5xl tracking-tight">Bodrum Yalıkavak Villa</h1>
<p class="font-sans text-base text-muted">Drone ile çekilmiş 360° tur</p>
```

### Type Scale (Tailwind)

| Kullanım | Class | Notes |
|---|---|---|
| Hero | `text-6xl md:text-7xl font-display` | leading-[1.05] |
| Page title | `text-3xl md:text-4xl font-display` | |
| Card title | `text-lg font-medium font-sans` | |
| Body | `text-base font-sans` | leading-relaxed |
| Small | `text-sm font-sans text-muted` | |
| Caption | `text-xs uppercase tracking-wider text-subtle font-sans` | |

**Asla** `text-9xl` veya `font-black` kullanma — drama abartı olur.

---

## 📐 Spacing & Layout

### Grid
- Maksimum içerik genişliği: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Dashboard içerik genişliği: `max-w-6xl`
- Form genişliği: `max-w-md` (auth) veya `max-w-2xl` (settings)

### Spacing scale
Tailwind default. Tutarlılık için kart içi padding **her yerde `p-6`**, küçük çevreli alanlarda `p-4`.

### Mobile breakpoints (Tailwind default)

```
sm:  640px   → büyük telefonlar / küçük tablet (landscape phone)
md:  768px   → tablet
lg:  1024px  → laptop
xl:  1280px  → desktop
2xl: 1536px  → büyük monitör
```

**Tasarım önce 375px için yapılır** (iPhone SE — sıkışıklığın anchor noktası), sonra `md:` ve `lg:` ile genişler. Desktop-only kullanılmaz.

---

## 🧩 Bileşen Davranışları

### Buton (shadcn `Button`)

```tsx
// Birincil aksiyon
<Button>Projeyi Yayınla</Button>

// İkincil
<Button variant="secondary">İptal</Button>

// Ghost (toolbar, navigation)
<Button variant="ghost">Düzenle</Button>

// Yıkıcı
<Button variant="destructive">Sil</Button>
```

- Yükleme durumunda: ikon yerine küçük spinner (`Loader2` lucide), text kalır.
- Disabled'da pointer-events-none + opacity-50.
- **Çoklu buton yan yana yerleştirildiğinde:** Mobilde stack (full width), desktop'ta yatay. Form footer için: `flex flex-col-reverse sm:flex-row sm:justify-end gap-2`. Primary action sağda (Mac/Windows uyumu).

### Kart (Card)

```tsx
<div class="rounded-xl bg-surface border border-border p-6 hover:border-border-strong transition-colors">
  ...
</div>
```

Hover effect **sadece** desktop'ta (`md:hover:...`). Mobilde hover yok, active state var (`active:opacity-80`).

### Modal / Dialog

- **Mobilde bottom sheet** (vaul kütüphanesi).
- **Desktop'ta center modal** (shadcn Dialog).
- Backdrop blur (`backdrop-blur-md`) ve %60 opaklık.
- Kapatma: ESC, backdrop tap, X ikonu — üçü de aktif.

### Form

```tsx
// Field grouping
<div className="space-y-1.5">
  <Label htmlFor="title">Proje Başlığı</Label>
  <Input id="title" {...register("title")} />
  {errors.title && <p className="text-sm text-danger">{errors.title.message}</p>}
  <p className="text-xs text-muted">Müşteriye görünecek şekilde.</p>
</div>
```

- Label her zaman yukarıda, sola dayalı.
- Floating label kullanma (browser autofill bozar).
- Error inline + kırmızı border.
- Submit'te ilk hatalı alana otomatik focus (`react-hook-form` setFocus).

### Tablo / Liste

Proje listesi gibi yerlerde **tablo değil, kart grid** kullan. Tablo sadece analitik veri (ülke dağılımı vb).

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {projects.map(p => <ProjectCard key={p.id} project={p} />)}
</div>
```

---

## 📱 Mobil Detaylar

### Touch Targets
- Minimum **44x44px** (Apple HIG). Tailwind: `min-h-11 min-w-11`.
- Buttonlar arası **min 8px gap** (yanlış tıklamayı önler).

### Scroll
- iOS bounce kontrolünü respect et — `overscroll-behavior: contain` sadece modal/drawer içinde.
- Sticky header'da `top: env(safe-area-inset-top)` kullan.

### Safe Areas
- Notch'lu cihazlar için: `pt-[env(safe-area-inset-top)]` ve `pb-[env(safe-area-inset-bottom)]`.
- Fullscreen viewer container `viewport-fit=cover` meta tag'i ile.

### Gesture
- **Swipe-back** native (iOS). Custom navigation kullanırken `history.pushState` korunmalı.
- 360 viewer'da iki parmak pan = sayfa scroll edilemez. `touch-action: none`.

### Input
- `inputmode` attribute'larını set et: `tel` numerik klavye için, `email` email için.
- Otomatik `autocorrect="off"` URL ve şifre input'larında.
- **Asla** `autocomplete="off"` koyma (browser password manager bozulur).

---

## 🎬 Animation & Motion

**Az ve anlamlı.** Her şey animate edilmez.

### Süre
- UI feedback (hover, tap): **100-150ms**
- Layout shift (modal aç/kapa, drawer): **200-300ms**
- Page transition: **300-400ms** veya yok
- Kapanış easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard ease-out)

### Framer Motion Kullanımı
Sadece şu durumlarda:
- 360 viewer açılış (fade in)
- Hotspot popup (scale + fade)
- Page transitions (varsa, opsiyonel)
- List enter (stagger ile)

Buton hover gibi şeyler **CSS transition** ile yapılır. Framer overkill.

### Reduce Motion
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 🌑 Loading & Empty States

### Skeleton
shadcn `Skeleton` component'i. **Ama her yerde değil.** Sadece content shift'in büyük olduğu yerlerde (kart grid, viewer).

### Empty State
Generic "Henüz veri yok" yerine, **action-oriented** mesaj + ikon + CTA:

```tsx
<div className="flex flex-col items-center text-center py-16">
  <div className="size-16 rounded-full bg-surface-elevated grid place-items-center mb-4">
    <ImageIcon className="size-7 text-subtle" />
  </div>
  <h3 className="font-display text-2xl mb-2">Henüz panorama yok</h3>
  <p className="text-muted max-w-sm mb-6">İlk 360° görüntünüzü yükleyin, otomatik tura çevirmeye başlayalım.</p>
  <Button>Panorama Yükle</Button>
</div>
```

### Error State
Toast + inline her ikisi. Toast kayıp olursa inline kalsın.

---

## 🎥 360 Viewer Özel UI

### Overlay Pattern

```
┌─────────────────────────────────────────────────┐
│  [Logo]  Proje Başlığı           [Share][⛶]    │ ← Top bar (fade out after 3s idle)
│                                                  │
│                                                  │
│              [ 360 PANORAMA ALANI ]              │
│                                                  │
│                                                  │
│  ┌──┬──┬──┐                  [VR] [♪] [▶ Auto]  │ ← Bottom controls
│  │ 🏠│ 🛏 │ 🏝│                                   │   (sol: panoramalar, sağ: controls)
│  └──┴──┴──┘                                      │
└─────────────────────────────────────────────────┘
```

- Tüm overlay'lar yarı saydam (`bg-black/40 backdrop-blur-md`).
- Idle 3 saniye → overlay'lar fade out (sadece desktop; mobilde tap ile toggle).
- Hotspot ikonları: pulsing animation (yavaş, dikkat çekmek için ama göz yormayan).

### Hotspot Görsel
- Default: 32px daire, ortasında ok veya bilgi `i` ikonu.
- Hover'da scale 1.1.
- Active panorama'ya yakınken (link hotspot): subtle pulse.

---

## ♿ Accessibility

- Semantic HTML her yerde (`<button>`, `<nav>`, `<main>`, vb).
- Kontrast ratio minimum **4.5:1** (WCAG AA). Accent buton özellikle.
- Focus ring her etkileşimli element'te görünür (`focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-background`).
- Form label'ları her zaman `for=` ile bağlı.
- 360 viewer alternatifi: panoramaların thumbnail listesi keyboard navigable.
- `aria-label` butonlarda (özellikle icon-only).

---

## 🚫 Yapma Listesi

- Gradient backgroundlar (mavi → mor vb generic Tailwind look)
- Glass morphism overuse (subtle backdrop-blur OK, **her şey** glass değil)
- Stock icon library'ler (Heroicons OK ama tek tip lucide kalalım)
- 3 farklı font ailesi
- Drop shadow patlaması (`shadow-2xl` her yerde)
- Auto-playing music
- Modal'ı modal içinde aç (nested overlay)
- "Generated with AI" hissi veren her detay

---

## 🎁 Bonus: Brand Touch

Logo henüz yok. CLAUDE.md'de sahip seçecek. Geçici: **lucide `Compass` ikonu + "drone360" wordmark** (font-display, lowercase).

Favicon: amber daire içinde beyaz compass ikonu.

OG image (1200x630): koyu gradient zemin, ortada amber çizgi, "360° Panorama Showcase" + altta drone silueti.
