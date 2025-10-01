import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

const DEFAULT_SUPABASE_URL = "https://iqafhqbiwpqpfridpgaq.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYWZocWJpd3BxcGZyaWRwZ2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzIyMzYsImV4cCI6MjA3NDMwODIzNn0.e-bBVaqRRHhLN-7kYXNJjyBD-DgIUwlzOGnDEXDQzLQ";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
