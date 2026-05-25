import { redirect } from "next/navigation";
import { Clock, LogOut } from "lucide-react";
import { getProfile } from "@/lib/auth/permissions";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status === "pending") {
    return <PendingApprovalScreen email={profile.email} />;
  }

  return (
    <DashboardShell
      email={profile.email}
      fullName={profile.full_name}
      isAdmin={profile.role === "admin"}
    >
      {children}
    </DashboardShell>
  );
}

function PendingApprovalScreen({ email }: { email: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="size-16 rounded-full bg-amber-500/10 border border-amber-500/20 grid place-items-center mb-6">
        <Clock className="size-7 text-amber-500" strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-3xl mb-2">Hesabınız onay bekliyor</h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-1">
        <span className="font-medium text-foreground">{email}</span> adresiyle kaydoldunuz.
      </p>
      <p className="text-muted-foreground text-sm max-w-sm mb-8">
        Yönetici hesabınızı onayladıktan sonra platforma erişebilirsiniz.
      </p>
      <form action="/api/auth/signout" method="post">
        <button
          type="submit"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="size-3.5" />
          Çıkış Yap
        </button>
      </form>
    </div>
  );
}
