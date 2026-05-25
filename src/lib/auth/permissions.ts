import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// cache() deduplicates across a single request — avoids repeated auth+DB round trips
// when getProfile() is called from multiple places (page + generateMetadata etc.)
export const getProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
});

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const profile = await getProfile();
  if (!profile) throw new Error("Bu işlem için giriş yapmanız gereklidir.");
  return profile;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    throw new Error("Bu işlem için admin yetkisi gereklidir.");
  }
  return profile;
}
