import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const { id: projectId } = await params;
  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Geçersiz sıralama." } }, { status: 400 });
  }

  const supabase = await createClient();

  // Update positions in parallel (unique constraint means we need temp values first)
  // Use large offsets to avoid conflicts, then set final positions
  const offset = 100000;
  await Promise.all(
    parsed.data.ids.map((pid, index) =>
      supabase
        .from("panoramas")
        .update({ position: offset + index })
        .eq("id", pid)
        .eq("project_id", projectId)
        .is("deleted_at", null)
    )
  );

  await Promise.all(
    parsed.data.ids.map((pid, index) =>
      supabase
        .from("panoramas")
        .update({ position: index })
        .eq("id", pid)
        .eq("project_id", projectId)
        .is("deleted_at", null)
    )
  );

  return NextResponse.json({ success: true });
}
