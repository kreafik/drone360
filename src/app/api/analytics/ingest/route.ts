import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  eventType: z.enum([
    "view_start",
    "view_end",
    "panorama_change",
    "hotspot_click",
    "fullscreen_enter",
    "vr_enter",
  ]),
  projectId: z.string().uuid(),
  sessionId: z.string().min(1).max(64),
  shareId: z.string().uuid().nullable().optional(),
  panoramaId: z.string().uuid().nullable().optional(),
  hotspotId: z.string().uuid().nullable().optional(),
  durationMs: z.number().int().min(0).optional(),
  referrer: z.string().max(500).nullable().optional(),
});

function parseUA(ua: string): {
  device_type: string;
  browser: string;
  os: string;
} {
  const device =
    /tablet|ipad/i.test(ua)
      ? "tablet"
      : /mobile|android|iphone/i.test(ua)
        ? "mobile"
        : "desktop";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\//i.test(ua)
      ? "Opera"
      : /chrome/i.test(ua)
        ? "Chrome"
        : /firefox/i.test(ua)
          ? "Firefox"
          : /safari/i.test(ua)
            ? "Safari"
            : "Other";

  const os = /windows/i.test(ua)
    ? "Windows"
    : /android/i.test(ua)
      ? "Android"
      : /iphone|ipad/i.test(ua)
        ? "iOS"
        : /mac os x/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Other";

  return { device_type: device, browser, os };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  const {
    eventType,
    projectId,
    sessionId,
    shareId,
    panoramaId,
    hotspotId,
    durationMs,
    referrer,
  } = parsed.data;

  const ua = req.headers.get("user-agent") ?? "";
  const { device_type, browser, os } = parseUA(ua);
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    null;

  const supabase = createAdminClient();
  await supabase.from("analytics_events").insert({
    event_type: eventType,
    project_id: projectId,
    session_id: sessionId,
    share_id: shareId ?? null,
    panorama_id: panoramaId ?? null,
    hotspot_id: hotspotId ?? null,
    duration_ms: durationMs ?? null,
    referrer: referrer ?? null,
    country,
    device_type,
    browser,
    os,
    metadata: {},
  });

  return new NextResponse(null, { status: 204 });
}
