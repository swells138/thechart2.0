import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

import { getSupabaseAnonKey, getSupabaseUrl } from "./supabaseConfig";

let browserSupabase: ReturnType<typeof createBrowserClient> | undefined;

if (typeof window !== "undefined") {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  browserSupabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = browserSupabase;
