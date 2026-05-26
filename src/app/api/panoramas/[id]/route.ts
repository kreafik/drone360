import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { r2, R2_BUCKET } from "@/lib/r2/client";

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  defaultYaw: z.number().optional().nullable(),
  defaultPitch: z.number().optional().nullable(),
  defaultZoom: z.number().min(0).max(100).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Geçersiz veri." } }, { status: 400 });
  }

  const { title, defaultYaw, defaultPitch, defaultZoom } = parsed.data;
  const update: {
    title?: string;
    default_yaw?: number | null;
    default_pitch?: number | null;
    default_zoom?: number | null;
  } = {};
  if (title) update.title = title;
  if ("defaultYaw" in parsed.data) update.default_yaw = defaultYaw;
  if ("defaultPitch" in parsed.data) update.default_pitch = defaultPitch;
  if ("defaultZoom" in parsed.data) update.default_zoom = defaultZoom;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: { message: "Güncellenecek alan yok." } }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("panoramas")
    .update(update)
    .eq("id", id)
    .is("deleted_at", null);

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
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();

  // Fetch keys before soft-deleting so we can clean up R2
  const { data: pano } = await supabase
    .from("panoramas")
    .select("storage_key, thumbnail_key")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  const { error } = await supabase
    .from("panoramas")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  // Delete R2 objects (fire-and-forget; don't fail the response if R2 errors)
  if (pano) {
    const keys = [pano.storage_key, pano.thumbnail_key].filter(Boolean) as string[];
    await Promise.allSettled(
      keys.map((key) => r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })))
    );
  }

  return NextResponse.json({ success: true });
}
