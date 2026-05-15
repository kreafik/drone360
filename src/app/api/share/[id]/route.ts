import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
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

  const update: { is_active?: boolean } = {};
  if (parsed.data.isActive !== undefined) update.is_active = parsed.data.isActive;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: { message: "Güncellenecek alan yok." } }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("shares").update(update).eq("id", id);

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
  const { error } = await supabase.from("shares").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
