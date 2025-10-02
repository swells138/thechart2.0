const DEFAULT_SUPABASE_URL = "https://iqafhqbiwpqpfridpgaq.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYWZocWJpd3BxcGZyaWRwZ2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzIyMzYsImV4cCI6MjA3NDMwODIzNn0.e-bBVaqRRHhLN-7kYXNJjyBD-DgIUwlzOGnDEXDQzLQ";

export function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    DEFAULT_SUPABASE_URL
  );
}

export function getSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    DEFAULT_SUPABASE_ANON_KEY
  );
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable required for server-side Supabase access.",
    );
  }

  return serviceRoleKey;
}
