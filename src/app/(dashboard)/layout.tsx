import { redirect } from "next/navigation";
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
