import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Upload,
  MapPin,
  Share2,
  BarChart3,
  ChevronDown,
  Check,
  Eye,
  Lock,
  Layers,
} from "lucide-react";
import { getProfile } from "@/lib/auth/permissions";
import { LandingDemo } from "@/components/landing/landing-demo";

export const metadata = {
  title: "drone360 — 360° Sanal Tur Platformu",
  description:
    "Drone ile çekilen 360° panoramalarınızı sanal turlara dönüştürün. Gayrimenkul ve tekne projelerinizi müşterilerinizle paylaşın.",
};

export default async function RootPage() {
  try {
    const profile = await getProfile();
    if (profile) redirect("/dashboard");
  } catch {
    // Not logged in — show landing page
  }

  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function LandingNavbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-5 md:px-10 bg-background/80 backdrop-blur-md border-b border-border/50">
      <Link href="/" className="flex items-center gap-2 text-primary">
        <Compass className="size-5" strokeWidth={1.5} />
        <span className="font-display text-lg lowercase tracking-tight">drone360</span>
      </Link>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 hover:bg-primary/90 transition-colors"
      >
        Giriş Yap
      </Link>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-dvh flex flex-col items-center justify-center px-5 pt-14 pb-24 overflow-hidden">
      {/* Background layers */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.27 0.012 240 / 0.35) 1px, transparent 1px), linear-gradient(90deg, oklch(0.27 0.012 240 / 0.35) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 65% at 50% -5%, oklch(0.78 0.16 70 / 0.14), transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-40"
        style={{
          background: "linear-gradient(to top, oklch(0.13 0.01 240), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3.5 py-1 text-xs font-medium text-primary tracking-wider uppercase">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          360° Sanal Tur Platformu
        </div>

        {/* Heading */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-balance">
          Drone Çekimlerinizi{" "}
          <span
            className="italic"
            style={{
              background: "linear-gradient(135deg, oklch(0.92 0.16 70), oklch(0.68 0.18 55))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Sanal Tura
          </span>{" "}
          Dönüştürün
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Gayrimenkul, tekne ve arazi projelerinizi profesyonel 360° sanal turlarla sunun.
          Hotspot ekleyin, müşterilerinizle paylaşın, analizleri takip edin.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-medium px-7 py-3 text-sm hover:bg-primary/90 transition-all hover:scale-[1.03] shadow-[0_0_32px_oklch(0.78_0.16_70/0.25)]"
          >
            Hemen Başlayın
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-full border border-border text-foreground/80 font-medium px-7 py-3 text-sm hover:bg-surface hover:text-foreground transition-all"
          >
            <Eye className="size-4" />
            Canlı Demo
          </a>
        </div>

        {/* Social proof badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {[
            "Hotspot Navigasyon",
            "Şifreli Paylaşım",
            "Analitik",
            "R2 Depolama",
          ].map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Check className="size-3.5 text-primary" />
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#demo"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <ChevronDown className="size-5 animate-bounce" />
      </a>
    </section>
  );
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

function DemoSection() {
  return (
    <section id="demo" className="relative px-5 md:px-10 pb-32 -mt-10">
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-64"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.78 0.16 70 / 0.06), transparent)",
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-10 space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Canlı Demo
          </p>
          <h2 className="font-display text-3xl md:text-4xl">Tam böyle görünüyor</h2>
          <p className="text-sm text-muted-foreground">
            Sürükle, dön, hotspot'lara tıkla — gerçek ürün, gerçek etkileşim.
          </p>
        </div>

        {/* Browser chrome frame */}
        <div
          className="rounded-2xl overflow-hidden border border-border/80 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
          style={{
            boxShadow:
              "0 0 0 1px oklch(0.27 0.012 240), 0 32px 80px rgba(0,0,0,0.7), 0 0 80px oklch(0.78 0.16 70 / 0.05)",
          }}
        >
          {/* Titlebar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-red-500/70" />
              <div className="size-3 rounded-full bg-yellow-500/70" />
              <div className="size-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 bg-surface-elevated rounded-md h-6 flex items-center justify-center px-3 mx-4 max-w-sm mx-auto">
              <span className="text-[11px] text-muted-foreground/70 font-mono">
                drone360.app/v/örnek-proje
              </span>
            </div>
          </div>

          {/* Viewer */}
          <div className="h-[460px] md:h-[560px] relative bg-black">
            <LandingDemo />

            {/* Overlay caption */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] text-white/70 whitespace-nowrap">
                  Sürükle & döndür — Hotspot'lara tıkla
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Upload,
    title: "Büyük Dosya Desteği",
    description:
      "50MB+ 360° panoramalarınızı doğrudan Cloudflare R2'ye yükleyin. Vercel limitleri yok, sınırsız boyut.",
  },
  {
    icon: MapPin,
    title: "Gelişmiş Hotspot'lar",
    description:
      "Satılık/kiralık alan etiketleri, bilgi noktaları, panoramalar arası geçiş pinleri ve metin label'ları.",
  },
  {
    icon: Share2,
    title: "Müşteri Paylaşımı",
    description:
      "Her proje için özel link. İsteğe bağlı şifre koruması ve son kullanma tarihi.",
  },
  {
    icon: BarChart3,
    title: "Görüntülenme Analitiği",
    description:
      "Ziyaretçi sayısı, ülke, cihaz ve hotspot tıklanma istatistikleri. Gerçek zamanlı takip.",
  },
  {
    icon: Lock,
    title: "Çok Kullanıcı",
    description:
      "Müşterilerinize hesap açın, projelere editör veya görüntüleyici olarak atayın.",
  },
  {
    icon: Layers,
    title: "Sanal Tur & Kat Geçişi",
    description:
      "Birden fazla panoramayı bağlayın. Kat planı navigasyonu ile çok katlı mülk turları.",
  },
];

function FeaturesSection() {
  return (
    <section className="px-5 md:px-10 py-24 relative">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 80% 50%, oklch(0.78 0.16 70 / 0.04), transparent)",
        }}
      />
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Özellikler
          </p>
          <h2 className="font-display text-3xl md:text-4xl">
            Profesyonel sunuş için her şey
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Drone çekiminden müşteri sunumuna kadar tüm iş akışı tek platformda.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group relative rounded-xl border border-border bg-surface p-6 space-y-3 hover:border-border-strong hover:bg-surface-elevated transition-colors"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                <Icon className="size-5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-medium text-sm">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    title: "Panoramalarınızı Yükleyin",
    description:
      "360° equirectangular JPEG veya JPG dosyalarınızı sürükle-bırak ile yükleyin. Sistem otomatik thumbnail oluşturur.",
  },
  {
    number: "02",
    title: "Tur & Hotspot Oluşturun",
    description:
      "Panoramalar arası geçiş noktaları, alan etiketleri ve bilgi hotspot'ları ekleyin. Anlık önizleme ile düzenleyin.",
  },
  {
    number: "03",
    title: "Müşterinizle Paylaşın",
    description:
      "Tek tıkla özel link oluşturun. İsteğe bağlı şifre ve son kullanma tarihi belirleyip müşterinize gönderin.",
  },
];

function HowItWorksSection() {
  return (
    <section className="px-5 md:px-10 py-24 border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Nasıl Çalışır
          </p>
          <h2 className="font-display text-3xl md:text-4xl">
            Üç adımda yayına alın
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-8 left-[calc(16.666%+1.5rem)] right-[calc(16.666%+1.5rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none" />

          {STEPS.map(({ number, title, description }) => (
            <div key={number} className="flex flex-col items-center text-center gap-4">
              <div
                className="relative size-16 rounded-full border border-primary/30 flex items-center justify-center shrink-0"
                style={{
                  background:
                    "radial-gradient(circle at 40% 40%, oklch(0.78 0.16 70 / 0.12), transparent)",
                }}
              >
                <span className="font-display text-xl text-primary italic">{number}</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="px-5 md:px-10 py-24 border-t border-border/50 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, oklch(0.78 0.16 70 / 0.07), transparent)",
        }}
      />
      <div className="relative max-w-2xl mx-auto text-center space-y-6">
        <h2 className="font-display text-3xl md:text-5xl leading-tight">
          Bugün başlayın
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
          Drone çekimlerinizi profesyonel sanal turlara dönüştürün. Kurulum gerektirmez.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-medium px-8 py-3.5 text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-[0_0_48px_oklch(0.78_0.16_70/0.3)]"
        >
          Panele Git
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="border-t border-border/50 px-5 md:px-10 py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <Compass className="size-4" strokeWidth={1.5} />
          <span className="font-display lowercase tracking-tight">drone360</span>
        </Link>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} drone360. Tüm hakları saklıdır.
        </p>
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Giriş Yap
        </Link>
      </div>
    </footer>
  );
}
