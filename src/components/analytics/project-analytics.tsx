import { createClient } from "@/lib/supabase/server";
import { Eye, Users, Clock, MousePointerClick } from "lucide-react";

interface DayBucket {
  date: string;
  views: number;
  visitors: Set<string>;
}

async function fetchAnalytics(projectId: string, days: number) {
  const supabase = await createClient();
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const { data: events } = await supabase
    .from("analytics_events")
    .select(
      "event_type, session_id, panorama_id, duration_ms, country, device_type, created_at"
    )
    .eq("project_id", projectId)
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: true });

  const rows = events ?? [];

  let totalViews = 0;
  const uniqueSessions = new Set<string>();
  const durations: number[] = [];
  let hotspotClicks = 0;
  const countryMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const dayMap = new Map<string, DayBucket>();

  // Pre-fill days
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { date: key, views: 0, visitors: new Set() });
  }

  for (const row of rows) {
    const dayKey = row.created_at.slice(0, 10);
    const bucket = dayMap.get(dayKey);

    if (row.event_type === "view_start") {
      totalViews++;
      uniqueSessions.add(row.session_id);
      if (bucket) {
        bucket.views++;
        bucket.visitors.add(row.session_id);
      }
      if (row.country) countryMap.set(row.country, (countryMap.get(row.country) ?? 0) + 1);
      if (row.device_type) deviceMap.set(row.device_type, (deviceMap.get(row.device_type) ?? 0) + 1);
    } else if (row.event_type === "view_end" && row.duration_ms != null) {
      durations.push(row.duration_ms);
    } else if (row.event_type === "hotspot_click") {
      hotspotClicks++;
    }
  }

  const avgDurationSec =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000)
      : null;

  const dailyViews = Array.from(dayMap.values()).map((b) => ({
    date: b.date,
    views: b.views,
    visitors: b.visitors.size,
  }));

  const topCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, count]) => ({ country, count }));

  const deviceBreakdown = Array.from(deviceMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  return {
    totalViews,
    uniqueVisitors: uniqueSessions.size,
    avgDurationSec,
    hotspotClicks,
    dailyViews,
    topCountries,
    deviceBreakdown,
    hasData: rows.length > 0,
  };
}

function formatDuration(sec: number | null) {
  if (sec === null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}d ${s}s` : `${m}d`;
}


const COUNTRY_NAMES: Record<string, string> = {
  TR: "Türkiye",
  US: "ABD",
  DE: "Almanya",
  GB: "İngiltere",
  FR: "Fransa",
  NL: "Hollanda",
  RU: "Rusya",
  AE: "B.A.E.",
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Mobil",
  desktop: "Masaüstü",
  tablet: "Tablet",
};

export async function ProjectAnalytics({
  projectId,
  days = 30,
}: {
  projectId: string;
  days?: number;
}) {
  const data = await fetchAnalytics(projectId, days);

  const stats = [
    {
      label: "Görüntülenme",
      value: data.totalViews,
      icon: Eye,
    },
    {
      label: "Tekil Ziyaretçi",
      value: data.uniqueVisitors,
      icon: Users,
    },
    {
      label: "Ort. Süre",
      value: formatDuration(data.avgDurationSec),
      icon: Clock,
    },
    {
      label: "Hotspot Tıklama",
      value: data.hotspotClicks,
      icon: MousePointerClick,
    },
  ];

  if (!data.hasData) {
    return (
      <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-border">
        <Eye className="size-8 text-subtle mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium">Henüz analitik verisi yok</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Projenizi paylaşıp müşterileriniz görüntüledikten sonra burada veriler görünecek.
        </p>
      </div>
    );
  }

  const maxViews = Math.max(...data.dailyViews.map((d) => d.views), 1);

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-subtle uppercase tracking-wider">{label}</p>
              <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Son {days} Gün</h3>
          <span className="text-xs text-subtle">Günlük görüntülenme</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-end gap-[3px] h-24">
            {data.dailyViews.map((d) => (
              <div
                key={d.date}
                className="group relative flex-1 flex flex-col justify-end"
              >
                <div
                  className="rounded-sm bg-amber-400/70 hover:bg-amber-400 transition-colors min-h-[2px]"
                  style={{
                    height: `${Math.max((d.views / maxViews) * 100, d.views > 0 ? 4 : 0)}%`,
                  }}
                />
                {d.views > 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-surface-elevated border border-border rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap z-10 shadow-sm">
                    {d.date.slice(5)}: {d.views}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-subtle">
            <span>{data.dailyViews[0]?.date.slice(5)}</span>
            <span>{data.dailyViews[Math.floor(data.dailyViews.length / 2)]?.date.slice(5)}</span>
            <span>{data.dailyViews[data.dailyViews.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      </div>

      {/* Country + Device */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Countries */}
        {data.topCountries.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-medium">Ülkeler</h3>
            <ul className="space-y-2">
              {data.topCountries.map(({ country, count }) => {
                const pct = Math.round((count / data.totalViews) * 100);
                return (
                  <li key={country} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{COUNTRY_NAMES[country] ?? country}</span>
                      <span className="text-subtle tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Devices */}
        {data.deviceBreakdown.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-medium">Cihazlar</h3>
            <ul className="space-y-2">
              {data.deviceBreakdown.map(({ type, count }) => {
                const pct = Math.round((count / data.totalViews) * 100);
                return (
                  <li key={type} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{DEVICE_LABELS[type] ?? type}</span>
                      <span className="text-subtle tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-surface-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-400/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
