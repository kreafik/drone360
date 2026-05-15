import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { projectSchema } from "@/lib/validation/project";

const updateSchema = projectSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export async function PATCH(
  request: NextRequest,
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
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Geçersiz veri." } },
      { status: 400 }
    );
  }

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
  if (ownerId !== undefined) update.owner_id = ownerId;
  if (status !== undefined) update.status = status;

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
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
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
