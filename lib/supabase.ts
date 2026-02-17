import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function getSupabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false }
  });
}
