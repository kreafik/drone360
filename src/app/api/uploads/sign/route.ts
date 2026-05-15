import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { r2, R2_BUCKET } from "@/lib/r2/client";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ["image/jpeg", "image/webp"] as const;

const signSchema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileType: z.enum(ALLOWED_TYPES),
  fileSize: z.number().int().positive().max(MAX_SIZE),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Geçersiz istek.", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const { projectId, fileName, fileType, fileSize } = parsed.data;

  const supabase = await createClient();

  // Verify project exists and isn't deleted
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  if (!project) {
    return NextResponse.json({ error: { message: "Proje bulunamadı." } }, { status: 404 });
  }

  // Get next position
  const { count } = await supabase
    .from("panoramas")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .is("deleted_at", null);

  const position = count ?? 0;

  // Generate panorama ID and R2 key
  const panoramaId = crypto.randomUUID();
  const ext = fileType === "image/webp" ? "webp" : "jpg";
  const storageKey = `panoramas/${projectId}/${panoramaId}.${ext}`;

  // Derive display title from file name
  const title = fileName.replace(/\.[^.]+$/, "").slice(0, 100) || "Panorama";

  // Create panorama record
  const { error: insertError } = await supabase.from("panoramas").insert({
    id: panoramaId,
    project_id: projectId,
    title,
    storage_key: storageKey,
    position,
    status: "uploading",
    file_size: fileSize,
  });

  if (insertError) {
    return NextResponse.json({ error: { message: insertError.message } }, { status: 500 });
  }

  // Generate presigned PUT URL (valid 15 minutes)
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: storageKey,
      ContentType: fileType,
      ContentLength: fileSize,
    }),
    { expiresIn: 900 }
  );

  return NextResponse.json({ panoramaId, uploadUrl, storageKey }, { status: 201 });
}
