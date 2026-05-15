import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/permissions";

const schema = z.object({
  fullName: z.string().min(1).max(100),
  companyName: z.string().max(100).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: { message: "Yetkisiz." } }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      company_name: parsed.data.companyName ?? null,
    })
    .eq("id", profile.id);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
