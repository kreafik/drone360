import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  targetPanoramaId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Geçersiz veri." } }, { status: 400 });
  }

  const update: {
    title?: string;
    description?: string | null;
    target_panorama_id?: string | null;
    metadata?: Json;
  } = {};
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if ("description" in parsed.data) update.description = parsed.data.description;
  if ("targetPanoramaId" in parsed.data) update.target_panorama_id = parsed.data.targetPanoramaId;
  if (parsed.data.metadata !== undefined) update.metadata = parsed.data.metadata as unknown as Json;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: { message: "Güncellenecek alan yok." } }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hotspots").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("hotspots").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
