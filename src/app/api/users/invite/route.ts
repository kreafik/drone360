import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/permissions";
import { inviteUserSchema } from "@/lib/validation/project";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Yetki gerekli." } }, { status: 403 });
  }

  const body = await request.json();
  const parsed = inviteUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { email, fullName, companyName, sendInvite } = parsed.data;
  const admin = createAdminClient();

  if (sendInvite) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, company_name: companyName },
    });
    if (error) {
      return NextResponse.json(
        { error: { code: "INVITE_FAILED", message: error.message } },
        { status: 400 }
      );
    }

    await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      company_name: companyName ?? null,
      role: "client",
    });

    return NextResponse.json({ success: true, userId: data.user.id });
  }

  // sendInvite false ise sadece profil oluştur (ileride kullanılabilir)
  return NextResponse.json({ success: true });
}
