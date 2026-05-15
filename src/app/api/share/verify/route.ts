import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";

const verifySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Geçersiz istek." } }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const supabase = await createClient();

  const { data: share } = await supabase
    .from("shares")
    .select("id, password_hash, is_active, expires_at")
    .eq("token", token)
    .single();

  if (!share || !share.is_active) {
    return NextResponse.json({ error: { message: "Geçersiz veya devre dışı link." } }, { status: 404 });
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: { message: "Bu link süresi dolmuş." } }, { status: 410 });
  }

  if (!share.password_hash) {
    return NextResponse.json({ error: { message: "Bu link parola gerektirmiyor." } }, { status: 400 });
  }

  const match = await bcrypt.compare(password, share.password_hash);
  if (!match) {
    return NextResponse.json({ error: { message: "Yanlış parola." } }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(`share_${token}_verified`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: `/`,
  });

  return response;
}
