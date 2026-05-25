import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { email, password, fullName, companyName } = parsed.data;
  const admin = createAdminClient();

  // Create user with email already confirmed — no verification email needed
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, company_name: companyName ?? null },
  });

  if (error) {
    const message = error.message.includes("already registered")
      ? "Bu e-posta adresi zaten kayıtlı."
      : error.message;
    return NextResponse.json({ error: { message } }, { status: 400 });
  }

  // Trigger creates the profile row; update it with name/company
  await admin.from("profiles").update({
    full_name: fullName,
    company_name: companyName ?? null,
  }).eq("id", data.user.id);

  return NextResponse.json({ success: true });
}
