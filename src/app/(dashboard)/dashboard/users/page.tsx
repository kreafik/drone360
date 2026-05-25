import { redirect } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserEditModal } from "@/components/users/user-edit-modal";
import { UserApproveButton } from "@/components/users/user-approve-button";

export const metadata = { title: "Kullanıcılar — drone360" };

export default async function UsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, company_name, role, status, created_at, brand_name, brand_logo_url, brand_primary_color")
    .order("created_at", { ascending: false });

  const pendingCount = users?.filter((u) => u.status === "pending").length ?? 0;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users?.length ?? 0} kayıtlı kullanıcı
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500">
                {pendingCount} onay bekliyor
              </span>
            )}
          </p>
        </div>
        <Link href="/dashboard/users/new" className={buttonVariants()}>
          <UserPlus className="mr-2 size-4" strokeWidth={1.5} />
          Yeni Müşteri
        </Link>
      </div>

      {!users?.length ? (
        <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-border">
          <div className="size-14 rounded-full bg-surface-elevated grid place-items-center mb-4">
            <UserPlus className="size-6 text-subtle" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-xl mb-2">Henüz kullanıcı yok</h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Kullanıcı davet ederek projelerini görüntülemelerini sağlayın.
          </p>
          <Link href="/dashboard/users/new" className={buttonVariants()}>
            Müşteri Davet Et
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-subtle font-medium">
                  Ad / E-posta
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-subtle font-medium hidden sm:table-cell">
                  Şirket
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-subtle font-medium hidden lg:table-cell">
                  Marka
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-subtle font-medium">
                  Durum
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-subtle font-medium hidden md:table-cell">
                  Kayıt
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const isPending = user.status === "pending";
                const brandColor = user.brand_primary_color;
                const brandName = user.brand_name;
                const brandLogoUrl = user.brand_logo_url;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${isPending ? "bg-amber-500/5" : "hover:bg-surface/60"}`}
                  >
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium">{user.full_name ?? "—"}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {user.company_name ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {brandName || brandLogoUrl ? (
                        <div className="flex items-center gap-2">
                          {brandColor && (
                            <span
                              className="inline-block size-3 rounded-full shrink-0 border border-border"
                              style={{ background: brandColor }}
                            />
                          )}
                          <span className="text-sm truncate max-w-[120px]">
                            {brandName ?? user.company_name ?? "—"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isPending ? (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500">
                          Onay bekliyor
                        </span>
                      ) : (
                        <Badge
                          variant={user.role === "admin" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {user.role === "admin" ? "Admin" : "Müşteri"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        {isPending ? (
                          <UserApproveButton userId={user.id} />
                        ) : (
                          <UserEditModal
                            user={{
                              id: user.id,
                              fullName: user.full_name,
                              companyName: user.company_name,
                              brandName,
                              brandLogoUrl,
                              brandPrimaryColor: brandColor,
                            }}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
