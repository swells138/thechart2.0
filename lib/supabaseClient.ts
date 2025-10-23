import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

import { getSupabaseAnonKey, getSupabaseUrl } from "./supabaseConfig";

let browserSupabase: ReturnType<typeof createBrowserClient> | null = null;

if (typeof window !== "undefined") {
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    browserSupabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    browserSupabase = null;

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Supabase client is not configured. Continuing without Supabase support.",
        error instanceof Error ? error : undefined,
      );
    }
  }
}

export const supabase = browserSupabase;
