import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  panoramaId: z.string().uuid(),
  type: z.enum(["link", "info", "pin"]),
  yaw: z.number(),
  pitch: z.number(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  targetPanoramaId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Geçersiz veri.", details: parsed.error.flatten() } }, { status: 400 });
  }

  const { panoramaId, type, yaw, pitch, title, description, targetPanoramaId } = parsed.data;

  if ((type === "link" || type === "pin") && !targetPanoramaId) {
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
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
