import { Compass } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Kayıt Ol — drone360",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="size-7" strokeWidth={1.5} />
          <span className="font-display text-2xl lowercase tracking-tight">
            drone360
          </span>
        </div>
        <h1 className="font-display text-3xl text-foreground">
          Hesap Oluşturun
        </h1>
        <p className="text-sm text-muted-foreground">
          Ücretsiz hesabınızı oluşturun ve 360° turlarınızı yönetin.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <RegisterForm />
      </div>
    </div>
  );
}
