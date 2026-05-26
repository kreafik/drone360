import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

const createSchema = z.object({
  panoramaId: z.string().uuid(),
  type: z.enum(["link", "info", "pin", "text", "area", "floor", "direction"]),
  yaw: z.number(),
  pitch: z.number(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  targetPanoramaId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Geçersiz veri.", details: parsed.error.flatten() } }, { status: 400 });
  }

  const { panoramaId, type, yaw, pitch, title, description, targetPanoramaId, metadata } = parsed.data;

  if ((type === "link" || type === "pin" || type === "floor") && !targetPanoramaId) {
    return NextResponse.json({ error: { message: "Geçiş hotspot için hedef panorama gereklidir." } }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotspots")
    .insert({
      panorama_id: panoramaId,
      type,
      yaw,
      pitch,
      title: title ?? null,
      description: description ?? null,
      target_panorama_id: targetPanoramaId ?? null,
      ...(metadata !== undefined ? { metadata: metadata as unknown as Json } : {}),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
