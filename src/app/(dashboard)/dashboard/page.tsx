import Link from "next/link";
import { getProfile } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  LayoutGrid,
  Eye,
  Users,
  Image as ImageIcon,
  Link2,
  Clock,
  HardDrive,
  UserCheck,
} from "lucide-react";

export const metadata = {
  title: "Dashboard — drone360",
};

// ─── Data fetching ──────────────────────────────────────────────────────────

async function getStats() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const profile = await getProfile();
  if (!profile) return null;

  const isAdmin = profile.role === "admin";

  const from7 = new Date();
  from7.setDate(from7.getDate() - 6);
  from7.setHours(0, 0, 0, 0);

  const from30 = new Date();
  from30.setDate(from30.getDate() - 30);

  // ── Parallel queries ──
  const [
    projectsRes,
    panoramasRes,
    sharesRes,
    viewsRes,
    clientsRes,
    pendingRes,
    storageRes,
    recentPanoramasRes,
    topProjectsRes,
    chartRes,
  ] = await Promise.all([
    // Total projects
    (() => {
      const q = supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null);
      if (!isAdmin) q.eq("owner_id", profile.id);
      return q;
    })(),

    // Total panoramas
    (() => {
      const q = supabase
        .from("panoramas")
        .select("id", { count: "exact", head: true })
        .eq("status", "ready")
        .is("deleted_at", null);
      return q;
    })(),

    // Active shares
    supabase
      .from("shares")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    // Views last 30d
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "view_start")
      .gte("created_at", from30.toISOString()),

    // Clients (admin only)
    isAdmin
      ? admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client")
      : Promise.resolve({ count: null }),

    // Pending approvals (admin only)
    isAdmin
      ? admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: null }),

    // Storage: sum of file sizes
    supabase
      .from("panoramas")
      .select("file_size")
      .eq("status", "ready")
      .is("deleted_at", null)
      .not("file_size", "is", null),

    // Recent 5 panoramas
    supabase
      .from("panoramas")
      .select("id, title, created_at, projects(title)")
      .eq("status", "ready")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),

    // Top 5 projects by views (last 30d)
    supabase
      .from("analytics_events")
      .select("project_id, projects(title)")
      .eq("event_type", "view_start")
      .gte("created_at", from30.toISOString())
      .limit(500),

    // Views per day last 7 days
    supabase
      .from("analytics_events")
      .select("created_at")
      .eq("event_type", "view_start")
      .gte("created_at", from7.toISOString()),
  ]);

  // Process storage
  const totalBytes = (storageRes.data ?? []).reduce(
    (sum, row) => sum + (row.file_size ?? 0),
    0
  );

  // Process top projects
  const projectViewMap: Record<string, { title: string; count: number }> = {};
  for (const row of topProjectsRes.data ?? []) {
    const id = row.project_id as string;
    const title =
      (row.projects as { title?: string } | null)?.title ?? "—";
    if (!projectViewMap[id]) projectViewMap[id] = { title, count: 0 };
    projectViewMap[id].count++;
  }
  const topProjects = Object.entries(projectViewMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, v]) => ({ id, title: v.title, views: v.count }));

  // Process chart: count views per day for last 7 days
  const days: { label: string; date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({
      label: d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" }),
      date: d.toISOString().slice(0, 10),
      count: 0,
    });
  }
  for (const row of chartRes.data ?? []) {
    const date = (row.created_at as string).slice(0, 10);
    const day = days.find((d) => d.date === date);
    if (day) day.count++;
  }

  return {
    projectCount: projectsRes.count ?? 0,
    panoramaCount: panoramasRes.count ?? 0,
    shareCount: sharesRes.count ?? 0,
    viewCount: viewsRes.count ?? 0,
    clientCount: isAdmin ? (clientsRes.count ?? 0) : null,
    pendingCount: isAdmin ? (pendingRes.count ?? 0) : null,
    totalBytes,
    recentPanoramas: (recentPanoramasRes.data ?? []) as {
      id: string;
      title: string;
      created_at: string;
      projects: { title: string } | null;
    }[],
    topProjects,
    chartDays: days,
    isAdmin,
    profile,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
  badge,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
  href?: string;
  badge?: number;
}) {
  const inner = (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-3 h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-subtle font-sans">{label}</p>
        <div className="relative rounded-md bg-surface-elevated p-2">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
          {badge != null && badge > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
      </div>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  if (href)
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  return inner;
}

function StorageWidget({ bytes }: { bytes: number }) {
  const R2_FREE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
  const pct = Math.min((bytes / R2_FREE_BYTES) * 100, 100);

  function fmt(b: number) {
    if (b < 1024) return `${b} B`;
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
    return `${(b / 1024 ** 3).toFixed(2)} GB`;
  }

  const barColor =
    pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-subtle font-sans">
          R2 Depolama
        </p>
        <div className="rounded-md bg-surface-elevated p-2">
          <HardDrive className="size-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold tabular-nums">{fmt(bytes)}</span>
          <span className="text-xs text-muted-foreground">/ 10 GB ücretsiz</span>
        </div>
        <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct.toFixed(1)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          %{pct < 0.1 ? "< 0.1" : pct.toFixed(1)} kullanıldı
        </p>
      </div>

      <div className="pt-1 border-t border-border grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Depolama", value: "10 GB" },
          { label: "Yazma Ops", value: "1M/ay" },
          { label: "Okuma Ops", value: "10M/ay" },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
            <p className="text-xs font-medium text-emerald-400 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewsChart({
  days,
}: {
  days: { label: string; count: number }[];
}) {
  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-subtle font-sans">
          Son 7 Gün Görüntülenme
        </p>
        <div className="rounded-md bg-surface-elevated p-2">
          <Eye className="size-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex items-end gap-1.5 h-24">
        {days.map((d) => {
          const heightPct = (d.count / max) * 100;
          const isToday = d === days[days.length - 1];
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full flex flex-col justify-end h-20 relative">
                {d.count > 0 && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium bg-surface-elevated border border-border rounded px-1 py-0.5 whitespace-nowrap z-10">
                    {d.count}
                  </div>
                )}
                <div
                  className={`rounded-t-sm transition-all ${
                    isToday ? "bg-primary/80" : "bg-primary/30 group-hover:bg-primary/50"
                  }`}
                  style={{ height: `${Math.max(heightPct, d.count > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Toplam {days.reduce((s, d) => s + d.count, 0)} görüntülenme
      </p>
    </div>
  );
}

function TopProjects({
  projects,
}: {
  projects: { id: string; title: string; views: number }[];
}) {
  const max = Math.max(...projects.map((p) => p.views), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <p className="text-xs uppercase tracking-wider text-subtle font-sans">
        En Çok Görüntülenen (30g)
      </p>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Henüz görüntülenme verisi yok
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="block group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm truncate max-w-[70%] group-hover:text-foreground transition-colors text-muted-foreground">
                  {p.title}
                </span>
                <span className="text-xs font-medium tabular-nums shrink-0">
                  {p.views} görüntülenme
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50 group-hover:bg-primary/70 transition-colors"
                  style={{ width: `${(p.views / max) * 100}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivity({
  panoramas,
}: {
  panoramas: {
    id: string;
    title: string;
    created_at: string;
    projects: { title: string } | null;
  }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <p className="text-xs uppercase tracking-wider text-subtle font-sans">
        Son Yüklenenler
      </p>

      {panoramas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Henüz panorama yok
        </p>
      ) : (
        <div className="divide-y divide-border">
          {panoramas.map((p) => (
            <div key={p.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="mt-0.5 size-7 rounded-md bg-surface-elevated flex items-center justify-center shrink-0">
                <ImageIcon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.projects?.title ?? "—"}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                {new Date(p.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const stats = await getStats();
  if (!stats) return null;

  const {
    projectCount,
    panoramaCount,
    shareCount,
    viewCount,
    clientCount,
    pendingCount,
    totalBytes,
    recentPanoramas,
    topProjects,
    chartDays,
    isAdmin,
    profile,
  } = stats;

  const greeting = profile.full_name
    ? `Hoş geldiniz, ${profile.full_name.split(" ")[0]}`
    : "Hoş geldiniz";

  return (
    <div className="max-w-6xl space-y-6">
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
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Proje"
          value={projectCount}
          icon={LayoutGrid}
          hint="Aktif projeler"
          href="/dashboard/projects"
        />
        <StatCard
          label="Panorama"
          value={panoramaCount}
          icon={ImageIcon}
          hint="Hazır panoramalar"
        />
        <StatCard
          label="Görüntülenme"
          value={viewCount}
          icon={Eye}
          hint="Son 30 gün"
        />
        <StatCard
          label="Paylaşım"
          value={shareCount}
          icon={Link2}
          hint="Aktif linkler"
        />
        {isAdmin && clientCount !== null && (
          <StatCard
            label="Müşteriler"
            value={clientCount}
            icon={Users}
            hint="Kayıtlı müşteri"
            href="/dashboard/users"
          />
        )}
        {isAdmin && pendingCount !== null && (
          <StatCard
            label="Onay Bekleyen"
            value={pendingCount}
            icon={UserCheck}
            hint="Aktivasyon bekliyor"
            href="/dashboard/users"
            badge={pendingCount}
          />
        )}
        {isAdmin && (
          <StatCard
            label="Süre Yaklaşık"
            value="—"
            icon={Clock}
            hint="Ort. seans süresi yakında"
          />
        )}
      </div>

      {/* Grafik + Storage */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ViewsChart days={chartDays} />
        {isAdmin && <StorageWidget bytes={totalBytes} />}
      </div>

      {/* Top projeler + Son yüklenenler */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TopProjects projects={topProjects} />
        <RecentActivity panoramas={recentPanoramas} />
      </div>
    </div>
  );
}
