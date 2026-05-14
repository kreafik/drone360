import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Şifremi Unuttum — drone360",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="size-7" strokeWidth={1.5} />
          <span className="font-display text-2xl lowercase tracking-tight">
            drone360
          </span>
        </div>
        <h1 className="font-display text-3xl text-foreground">
          Şifremi Unuttum
        </h1>
        <p className="text-sm text-muted-foreground">
          E-posta adresinize sıfırlama bağlantısı göndereceğiz.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <ForgotPasswordForm />
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}
