import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Service-role client — bypasses RLS. Server-only, never import from a
// client component. Used for privileged writes like caching TMDB data
// (regular users only ever get SELECT on movies_cache, see
// supabase/migrations/20260908000002_rls_policies.sql).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
