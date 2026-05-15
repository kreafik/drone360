import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { resolveUrl } from "@/lib/r2/urls";

const schema = z.object({
  panoramaId: z.string().uuid(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz." } }, { status: 403 });
  }

  const { id: projectId } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { panoramaId } = parsed.data;
  const supabase = await createClient();

  const { data: panorama } = await supabase
    .from("panoramas")
    .select("id, thumbnail_key, status")
    .eq("id", panoramaId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (!panorama || panorama.status !== "ready") {
    return NextResponse.json({ error: { message: "Panorama bulunamadı." } }, { status: 404 });
  }

  const coverUrl = await resolveUrl(panorama.thumbnail_key);
  if (!coverUrl) {
    return NextResponse.json({ error: { message: "Thumbnail bulunamadı." } }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("metadata")
    .eq("id", projectId)
    .single();

  const existingMeta = (project?.metadata as Record<string, unknown>) ?? {};

  const { error } = await supabase
    .from("projects")
    .update({
      cover_url: coverUrl,
      metadata: { ...existingMeta, cover_panorama_id: panoramaId },
    })
    .eq("id", projectId);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
