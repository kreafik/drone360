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
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  if (!isAdmin) projectsQuery.eq("owner_id", profile.id);
  const { count: projectCount } = await projectsQuery;

  // Total views in last 30 days
  const from30 = new Date();
  from30.setDate(from30.getDate() - 30);
  const viewsQuery = supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "view_start")
    .gte("created_at", from30.toISOString());
  const { count: viewCount } = await viewsQuery;

  // Client count (admin only)
  let clientCount: number | null = null;
  if (isAdmin) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "client");
    clientCount = count ?? 0;
  }

  return {
    projectCount: projectCount ?? 0,
    viewCount: viewCount ?? 0,
    clientCount,
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

  const { projectCount, viewCount, clientCount, isAdmin, profile } = stats;
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
          label="Görüntülenme (30g)"
          value={viewCount}
          icon={Eye}
          hint="Son 30 günde toplam"
        />
        {isAdmin && clientCount !== null && (
          <StatCard
            label="Müşteriler"
            value={clientCount}
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
