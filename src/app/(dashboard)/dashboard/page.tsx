import { getProfile } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { LayoutGrid, Eye, Users, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Dashboard — drone360",
};

async function getStats() {
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile) return null;

  const isAdmin = profile.role === "admin";

  const projectsQuery = supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  if (!isAdmin) {
    projectsQuery.eq("owner_id", profile.id);
  }

  const { count: projectCount } = await projectsQuery;

  return {
    projectCount: projectCount ?? 0,
    isAdmin,
    profile,
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-subtle font-sans">
          {label}
        </p>
        <div className="rounded-md bg-surface-elevated p-2">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getStats();
  if (!stats) return null;

  const { projectCount, isAdmin, profile } = stats;
  const greeting = profile.full_name
    ? `Hoş geldiniz, ${profile.full_name.split(" ")[0]}`
    : "Hoş geldiniz";

  return (
    <div className="max-w-6xl space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{greeting}</h1>
        <p className="mt-1 text-muted-foreground">
          {new Date().toLocaleDateString("tr-TR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stat kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Toplam Proje"
          value={projectCount}
          icon={LayoutGrid}
          hint="Tüm aktif projeler"
        />
        <StatCard
          label="Görüntülenme"
          value="—"
          icon={Eye}
          hint="Analytics Phase 6'da aktif olacak"
        />
        {isAdmin && (
          <StatCard
            label="Müşteriler"
            value="—"
            icon={Users}
            hint="Kayıtlı müşteri sayısı"
          />
        )}
      </div>

      {/* Boş durum — henüz proje yok */}
      {projectCount === 0 && (
        <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-border">
          <div className="size-16 rounded-full bg-surface-elevated grid place-items-center mb-4">
            <TrendingUp className="size-7 text-subtle" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-2xl mb-2">Henüz proje yok</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            İlk 360° projenizi oluşturun ve müşterilerinizle paylaşmaya başlayın.
          </p>
        </div>
      )}
    </div>
  );
}
