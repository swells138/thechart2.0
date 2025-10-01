import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseConfig";

export async function createSupabaseRouteClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  return createRouteHandlerClient(
    { cookies },
    {
      supabaseUrl,
      supabaseKey,
    },
  );
}
