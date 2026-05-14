# 📚 Proje Dökümantasyonu

Bu klasör, 360° Panorama Platform projesinin Claude Code ile geliştirilmesi için hazırlanmış dökümanları içerir.

## Dosyalar

| Dosya | İçerik | Ne zaman okunmalı |
|---|---|---|
| **CLAUDE.md** | Master rehber. Tech stack, kurallar, dosya yapısı, kod stili. | **Her oturum başında ilk okunan.** Repo root'a koy. |
| **PRD.md** | Ürün gereksinimleri. Persona'lar, MVP feature listesi, Phase 2/3 özellikleri. | Yeni feature implement ederken. |
| **ARCHITECTURE.md** | Teknik mimari. Data flow, klasör yapısı, R2 setup, env variables. | Yapısal karar verirken, API tasarlarken. |
| **DATABASE.md** | Supabase schema, RLS policy'leri, SQL migration'ları. | DB değişikliklerinde. Migration'lar bu dosyadan alınır. |
| **UI-UX.md** | Tasarım sistemi. Renkler, typography, mobile davranış, anti-pattern'ler. | **Her UI component'i üretilmeden önce.** |
| **ROADMAP.md** | Fazlı geliştirme planı (Phase 0 → 7). Her fazın adımları ve kabul kriterleri. | Sırasıyla takip. **Faz atlamak yok.** |

## Nasıl Kullanılır

### 1. Proje sıfırdan başlatılırken

```bash
# Yeni boş klasör
mkdir drone360 && cd drone360

# Bu docs/ klasörünü içine kopyala
# CLAUDE.md'yi root'a koy:
cp docs/CLAUDE.md ./CLAUDE.md

# Claude Code'u başlat
claude
```

İlk mesaj olarak:
> `CLAUDE.md ve docs/ROADMAP.md dosyalarını oku. Phase 0 — Setup ile başla. Her adımı sırayla uygula, onay almadan Phase 1'e geçme.`

### 2. Mevcut bir oturumdan devam edilirken

> `docs/ROADMAP.md'yi oku, en son nerede kaldığımıza bak, oradan devam et.`

### 3. Yeni feature ekleneceğinde

> `docs/PRD.md'de [feature ismi] tanımlı. docs/ARCHITECTURE.md'yi referans alarak implementasyonu yap. UI tarafında docs/UI-UX.md ve ui-ux-pro-max-skill'i kullan.`

## Skill Entegrasyonu

Bu doküman, kullanıcının yüklediği `ui-ux-pro-max-skill` skill'i ile birlikte çalışır. Claude Code:

1. UI component'i üretmeden önce **`ui-ux-pro-max-skill`'i view et**
2. Built-in `frontend-design` skill'i de oku (CSS variables, design tokens için)
3. **UI-UX.md** ile birleştir
4. Component üret

Çelişki olursa öncelik sırası: **skill'ler > UI-UX.md > Claude'un default'u**.

## Güvenlik Notu

`.env.local` içindeki credential'lar **hassas**. 

- `SUPABASE_SERVICE_ROLE_KEY`: tüm RLS'i bypass eder, sadece API route'larda
- `R2_SECRET_ACCESS_KEY`: bucket'a tam yazma yetkisi, sadece server-side

Eğer bu credential'lar bir yerde sızdıysa (Git history, chat log, screenshot), **derhal rotate et**:
- Supabase: Settings → API → Reset service_role key
- R2: Manage R2 API Tokens → Delete + Create new

## Soru-Cevap

**Q: Tek bir büyük CLAUDE.md yerine neden ayrı dosyalar?**  
A: Context window verimliliği. Claude Code başlangıçta sadece CLAUDE.md okur; diğerleri ihtiyaç anında yüklenir. Hepsi tek dosyada olsa her sorguda 30k+ token harcanır.

**Q: Bu dökümanları güncellemeli miyim?**  
A: Evet. Önemli kararlar (renk değişikliği, yeni feature, mimari değişiklik) ilgili dökümana yansıtılmalı. Claude Code'a da söyle: "X kararını aldık, ilgili .md dosyasını güncelle."

**Q: Roadmap'teki tahminler gerçekçi mi?**  
A: Tek başına çalışan deneyimli developer için. Claude Code ile süreler ~%40-60 kısalır ama her fazın sonunda mutlaka manuel test edilmeli.
