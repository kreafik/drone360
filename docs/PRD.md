# PRD — 360° Panorama Platform

## Vizyon

Drone ile çekilen 360° panoramaları (gayrimenkul + tekne) müşterilere şık, mobil-uyumlu, analitik destekli bir şekilde sunan **kendi-host'lu showcase platformu**. Hedef kitle:
- **Birincil:** Proje sahibinin kendisi (admin). İçerikleri organize edip müşterilere göstermek için.
- **İkincil:** Proje sahibinin müşterileri (emlakçı, tekne sahibi, mimar vb.) — kendi projelerini görmek, paylaşmak, embed almak için.
- **Üçüncül:** Müşterinin müşterileri (alıcı/kiracı/ilgilenen kişi) — paylaşılan linke girip turu izleyenler.

## Persona'lar

### 1. Admin (Cihan)
- Tüm sisteme tam erişim
- Yeni proje açar, panorama yükler, hotspot kurar
- Müşteri hesabı oluşturur, müşteriye proje atar
- Tüm projeler ve analitiği görür
- Sistem ayarlarını yönetir

### 2. Client (Müşteri)
- Sadece kendine atanmış projeleri görür
- Kendi projelerinin analitiğine bakar
- Paylaşım linkleri oluşturur
- Embed kodu alır
- (Opsiyonel) Yorum/feedback bırakır

### 3. Visitor (Anonim ziyaretçi)
- Paylaşılan link veya embed üzerinden tura erişir
- Login yok (opsiyonel: link'e parola konabilir)
- Otomatik olarak analitiği tetikler (anonim cookie ile)

---

## Çekirdek Özellikler (MVP)

### 1. Authentication
- Email + password ile giriş (Supabase Auth)
- Sadece admin yeni kullanıcı oluşturabilir — public signup **yok**
- "Şifremi unuttum" akışı (Supabase email)
- Magic link opsiyonu (faz 2)
- Role: `admin` veya `client` (profiles tablosunda)

### 2. Proje (Project) Yönetimi
Bir proje = bir lokasyon = bir sanal tur (örn: "Bodrum Yalıkavak Villa A", "Princess 56 Tekne Showcase")

**Admin yapar:**
- Yeni proje oluştur (başlık, açıklama, kapak görseli, tür: `real_estate` | `boat` | `other`, lokasyon)
- Müşteriye ata (`owner_id`)
- Durumu ayarla: `draft`, `published`, `archived`
- Sil (soft delete)

**Client görür:**
- Sadece kendi `owner_id`'sindeki published projeler

### 3. Panorama Yükleme
- Drag & drop veya buton ile yükleme
- **Equirectangular** format zorunlu (2:1 oran kontrolü client-side)
- Desteklenen format: JPG, JPEG, WEBP. Max boyut: 50MB.
- Upload akışı:
  1. Client `POST /api/uploads/sign` → R2 signed URL alır
  2. Client direkt R2'ye PUT eder (progress bar)
  3. Upload bitince `POST /api/panoramas` → DB'ye kayıt + sharp ile thumbnail üretimi (server-side background job)
- Her panoramanın: başlık, varsa "varsayılan görüş açısı" (yaw/pitch/zoom), thumbnail
- Birden fazla aynı anda yükleme (queue)

### 4. Tour Builder (Hotspot Editor)
Panoramalar arasında geçiş ve bilgi noktaları:
- **Link hotspot:** Tıklayınca başka bir panoramaya geçer
- **Info hotspot:** Tıklayınca popup (başlık + açıklama + opsiyonel görsel)
- Editor modu:
  - 360 viewer'ın içinde hotspot yerleştirme (sahnede tıkla → yaw/pitch yakala)
  - Sürükle-bırak ile yeniden konumlandırma
  - Sağ panel: hotspot listesi + düzenleme
- Floor plan / mini-map (faz 2)
- Background music / ambient sound (faz 3)

### 5. Viewer (Public ve Private)
- Photo Sphere Viewer v5 tabanlı
- Plugin'ler:
  - `VirtualTourPlugin` — panorama'lar arası geçiş
  - `MarkersPlugin` — hotspots
  - `GyroscopePlugin` — mobilde sensör desteği
  - `StereoPlugin` — VR (Google Cardboard) modu
  - `AutorotatePlugin` — otomatik dönme
- UI overlay:
  - Sol-alt: panorama listesi (mini kart şeklinde, tıklanabilir)
  - Sağ-alt: kontroller (fullscreen, VR, ses, autoplay, share)
  - Üst: proje başlığı + sahibin logosu (white-label faz 2)
- Mobil:
  - Tek parmak: pan
  - Pinch: zoom
  - Gyro otomatik aktif (kullanıcı kapatabilir)
  - Fullscreen tek dokunuşla

### 6. Sharing
- Her proje için **public share link** üret: `/v/{shareToken}` (rastgele, tahmin edilemez token)
- Opsiyonel:
  - Parola koruması
  - Geçerlilik tarihi (expires_at)
  - "Sadece kayıtlı kullanıcılar" modu
- **Embed code:** `<iframe src="https://app.com/embed/{shareToken}" />` — kopyala butonu
- Sosyal paylaşım meta tag'leri (OG image: proje kapak görseli)

### 7. Analytics
Anonim ziyaretçi analitiği. Hassas veri yok, GDPR dostu (sadece anonim session_id cookie).

**Toplanan veriler:**
- `view_start` (panorama açılışı — proje + panorama ID, session, referrer, user_agent, country)
- `view_end` (kapatma — duration_ms)
- `panorama_change` (tur içinde geçiş)
- `hotspot_click` (hotspot etkileşimi)

**Gösterilen metrikler (per project):**
- Toplam görüntülenme + tekil ziyaretçi
- Ortalama izlenme süresi
- En çok izlenen panorama
- Cihaz dağılımı (mobil/desktop/tablet)
- Ülke dağılımı (IP'den geolocation)
- Trafik kaynağı (direct, social, referrer)
- Zaman serisi grafiği (son 7/30 gün)

Hem admin hem ilgili client kendi projelerinin analitiğini görür.

---

## Phase 2 Özellikler

### Tour Enhancements
- **Mini-map** floor plan üzerinde aktif panoramayı gösteren
- **Info panel** her panorama için zengin metin (markdown)
- **Image gallery** panoramaya ek görseller
- **Video hotspot** YouTube/Vimeo embed

### Branding
- Client'a özel logo + renk paleti
- White-label embed (sahibinin marka adı görünmesin opsiyonu)
- Custom domain (`tour.client.com` → CNAME)

### Collaboration
- Müşteriden yorum/feedback toplama (review modu)
- Belirli hotspot'a yorum bırakma

### Lead Capture
- Tur içinde "ilgileniyorum" formu
- Toplanan lead'leri admin/client'a email + dashboard

---

## Phase 3 Özellikler

- Birden fazla admin (team)
- Saatlik/günlük rate limiting (anti-scraping)
- Bulk upload + CSV ile toplu hotspot import
- AI ile otomatik hotspot önerisi (Claude API)
- Tour'a arka plan müziği ekleme
- VR headset (Meta Quest browser) testi
- Karşılaştırma modu (önce/sonra render)

---

## Başarı Kriterleri

MVP başarılı sayılır eğer:
1. Admin tek bir tarayıcıdan 5+ panoramayı bir projeye yükleyip hotspot'larla bağlayabiliyorsa ≤ 10 dakika içinde
2. Müşteri kendi hesabına girip projesini ve analitiğini görebiliyorsa
3. Public share link mobil cihazda 4G üzerinden ≤ 5 saniyede ilk panorama'yı açıyorsa
4. Lighthouse mobile score ≥ 90 (Performance, Accessibility, Best Practices)
5. Tüm akışlar iPhone Safari ve Android Chrome'da kusursuz çalışıyorsa

---

## Non-goals (MVP'de YAPMA)

- Sosyal medya feed (kullanıcı kullanıcıyı takip etme vs.)
- Public marketplace (panorama satışı)
- Real-time co-viewing (birden fazla kişi aynı anda turu izleme)
- Native mobil uygulama (PWA yeterli)
- 3D modelleme veya Matterport'tan import
- AI ile otomatik panorama üretimi
