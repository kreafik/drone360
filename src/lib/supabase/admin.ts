import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// ⚠️ Sadece server-side (API routes, Server Actions). Client'a asla verme.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
