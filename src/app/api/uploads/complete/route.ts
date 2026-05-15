import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { r2, R2_BUCKET } from "@/lib/r2/client";

const completeSchema = z.object({
  panoramaId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Geçersiz istek." } }, { status: 400 });
  }

  const { panoramaId } = parsed.data;
  const supabase = await createClient();

  // Fetch panorama record
  const { data: panorama } = await supabase
    .from("panoramas")
    .select("id, project_id, storage_key, status")
    .eq("id", panoramaId)
    .single();

  if (!panorama || panorama.status !== "uploading") {
    return NextResponse.json({ error: { message: "Panorama bulunamadı." } }, { status: 404 });
  }

  // Mark as processing
  await supabase.from("panoramas").update({ status: "processing" }).eq("id", panoramaId);

  try {
    // Verify file exists in R2
    const headResult = await r2.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: panorama.storage_key })
    );
    const fileSize = headResult.ContentLength ?? 0;

    // Download from R2
    const getResult = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: panorama.storage_key })
    );
    const buffer = Buffer.from(await getResult.Body!.transformToByteArray());

    // Get image metadata
    const image = sharp(buffer);
    const meta = await image.metadata();

    // Generate thumbnail: 1280×640 WebP
    const thumbnailBuffer = await image
      .resize(1280, 640, { fit: "cover", position: "center" })
      .webp({ quality: 82 })
      .toBuffer();

    // Upload thumbnail to R2
    const thumbnailKey = `thumbnails/${panorama.project_id}/${panoramaId}.webp`;
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: "image/webp",
      })
    );

    // Update panorama record
    await supabase.from("panoramas").update({
      status: "ready",
      width: meta.width ?? null,
      height: meta.height ?? null,
      file_size: fileSize,
      thumbnail_key: thumbnailKey,
    }).eq("id", panoramaId);

    return NextResponse.json({ success: true });
  } catch (err) {
    await supabase.from("panoramas").update({ status: "failed" }).eq("id", panoramaId);
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
