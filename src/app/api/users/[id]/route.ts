import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  companyName: z.string().max(100).nullable().optional(),
  brandName: z.string().max(100).nullable().optional(),
  brandLogoUrl: z.string().url().max(500).nullable().optional(),
  brandPrimaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir HEX renk giriniz (#rrggbb)")
    .nullable()
    .optional(),
  status: z.enum(["pending", "active"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz." } }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { fullName, companyName, brandName, brandLogoUrl, brandPrimaryColor, status } =
    parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(fullName !== undefined && { full_name: fullName }),
      ...(companyName !== undefined && { company_name: companyName }),
      ...(brandName !== undefined && { brand_name: brandName }),
      ...(brandLogoUrl !== undefined && { brand_logo_url: brandLogoUrl }),
      ...(brandPrimaryColor !== undefined && { brand_primary_color: brandPrimaryColor }),
      ...(status !== undefined && { status }),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let adminProfile;
  try {
    adminProfile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: { message: "Yetkisiz." } }, { status: 403 });
  }

  const { id } = await params;

  if (id === adminProfile.id) {
    return NextResponse.json(
      { error: { message: "Kendi hesabınızı silemezsiniz." } },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
