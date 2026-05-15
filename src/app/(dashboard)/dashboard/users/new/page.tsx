import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { InviteUserForm } from "@/components/auth/invite-user-form";

export const metadata = { title: "Yeni Müşteri — drone360" };

export default async function NewUserPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Kullanıcılara dön
        </Link>
        <h1 className="font-display text-3xl">Yeni Müşteri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Müşteriye Supabase üzerinden davet e-postası gönderilir.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <InviteUserForm />
      </div>
    </div>
  );
}
