import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { requireAdmin, requireAuth } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { projectSchema } from "@/lib/validation/project";
import { r2, R2_BUCKET } from "@/lib/r2/client";

const updateSchema = projectSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let profile;
  try {
    profile = await requireAuth();
  } catch {
    return NextResponse.json(
      { error: { message: "Yetkisiz erişim." } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Geçersiz veri." } },
      { status: 400 }
    );
  }

  const isAdmin = profile.role === "admin";
  const { title, description, type, location, ownerId, status } = parsed.data;

  const update: {
    title?: string;
    description?: string | null;
    type?: "real_estate" | "boat" | "other";
    location?: string | null;
    owner_id?: string;
    status?: "draft" | "published" | "archived";
  } = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (type !== undefined) update.type = type;
  if (location !== undefined) update.location = location;
  // Only admin can reassign owner or change status
  if (isAdmin && ownerId !== undefined) update.owner_id = ownerId;
  if (isAdmin && status !== undefined) update.status = status;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: { message: "Yetkisiz erişim." } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Fetch all panorama R2 keys before soft-deleting
  const { data: panoramas } = await supabase
    .from("panoramas")
    .select("storage_key, thumbnail_key")
    .eq("project_id", id)
    .is("deleted_at", null);

  // Soft-delete the project and all its panoramas atomically
  const [projectRes] = await Promise.all([
    supabase
      .from("projects")
      .update({ deleted_at: now })
      .eq("id", id)
      .is("deleted_at", null),
    supabase
      .from("panoramas")
      .update({ deleted_at: now })
      .eq("project_id", id)
      .is("deleted_at", null),
  ]);

  if (projectRes.error) {
    return NextResponse.json(
      { error: { message: projectRes.error.message } },
      { status: 500 }
    );
  }

  // Delete R2 objects (fire-and-forget)
  if (panoramas?.length) {
    const keys = panoramas
      .flatMap((p) => [p.storage_key, p.thumbnail_key])
      .filter(Boolean) as string[];
    await Promise.allSettled(
      keys.map((key) => r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })))
    );
  }

  return NextResponse.json({ success: true });
}
