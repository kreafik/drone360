import { Compass } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Giriş Yap — drone360",
};

export default function LoginPage() {
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
          Hoş geldiniz
        </h1>
        <p className="text-sm text-muted-foreground">
          Devam etmek için giriş yapın.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <LoginForm />
      </div>
    </div>
  );
}
