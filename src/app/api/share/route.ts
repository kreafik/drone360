import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin, getProfile } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  projectId: z.string().uuid(),
  password: z.string().min(4).max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: { message: "projectId gerekli." } }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shares")
    .select("id, token, is_active, expires_at, password_hash, view_count, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((s) => ({
      id: s.id,
      token: s.token,
      isActive: s.is_active,
      expiresAt: s.expires_at,
      hasPassword: !!s.password_hash,
      viewCount: s.view_count ?? 0,
      createdAt: s.created_at,
    }))
  );
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz erişim." } }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Geçersiz veri." } }, { status: 400 });
  }

  const { projectId, password, expiresAt } = parsed.data;
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: { message: "Oturum bulunamadı." } }, { status: 401 });
  }

  const supabase = await createClient();

  // Verify project exists
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  if (!project) {
    return NextResponse.json({ error: { message: "Proje bulunamadı." } }, { status: 404 });
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  const { data, error } = await supabase
    .from("shares")
    .insert({
      project_id: projectId,
      token,
      password_hash: passwordHash,
      expires_at: expiresAt ?? null,
      created_by: profile.id,
    })
    .select("id, token")
    .single();

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, token: data.token }, { status: 201 });
}
