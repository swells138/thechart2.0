import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqafhqbiwpqpfridpgaq.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYWZocWJpd3BxcGZyaWRwZ2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzIyMzYsImV4cCI6MjA3NDMwODIzNn0.e-bBVaqRRHhLN-7kYXNJjyBD-DgIUwlzOGnDEXDQzLQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = NonNullable<typeof supabase>;

export function requireSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase client has not been configured.');
  }

  return supabase;
}
