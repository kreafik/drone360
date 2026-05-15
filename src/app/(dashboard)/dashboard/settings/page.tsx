import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/permissions";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Ayarlar — drone360" };

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Ayarlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hesap bilgilerini ve şifreni yönet.
        </p>
      </div>

      <SettingsForm
        profile={{
          id: profile.id,
          fullName: profile.full_name,
          companyName: profile.company_name,
          email: profile.email,
        }}
      />
    </div>
  );
}
