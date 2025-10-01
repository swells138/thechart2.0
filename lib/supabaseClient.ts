import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

import { getSupabaseAnonKey, getSupabaseUrl } from "./supabaseConfig";

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
