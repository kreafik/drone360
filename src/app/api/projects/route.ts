import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { projectSchema } from "@/lib/validation/project";

export async function POST(request: NextRequest) {
  let profile;
  try {
    profile = await requireAuth();
  } catch {
    return NextResponse.json(
      { error: { message: "Yetkisiz erişim." } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Geçersiz veri." } },
      { status: 400 }
    );
  }

  const { title, description, type, location, ownerId } = parsed.data;
  const isAdmin = profile.role === "admin";

  // Non-admin users can only create projects for themselves
  const resolvedOwnerId = isAdmin ? (ownerId ?? profile.id) : profile.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      description: description ?? null,
      type,
      location: location ?? null,
      owner_id: resolvedOwnerId,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
