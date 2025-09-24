const supabaseUrl = 'https://iqafhqbiwpqpfridpgaq.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYWZocWJpd3BxcGZyaWRwZ2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MzIyMzYsImV4cCI6MjA3NDMwODIzNn0.e-bBVaqRRHhLN-7kYXNJjyBD-DgIUwlzOGnDEXDQzLQ';

type SupabaseQueryResult<T> = {
  data: T | null;
  error: Error | null;
};

type SupabaseTableApi = {
  select<T = unknown>(columns?: string): Promise<SupabaseQueryResult<T>>;
};

export type SupabaseClient = {
  from(table: string): SupabaseTableApi;
};

function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  const trimmedUrl = url.replace(/\/$/, '');
  const restEndpoint = `${trimmedUrl}/rest/v1`;

  return {
    from(table: string): SupabaseTableApi {
      const resource = encodeURIComponent(table);

      return {
        async select<T = unknown>(columns = '*'): Promise<SupabaseQueryResult<T>> {
          try {
            const searchParams = new URLSearchParams({ select: columns });
            const response = await fetch(`${restEndpoint}/${resource}?${searchParams.toString()}`, {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                Accept: 'application/json',
              },
              cache: 'no-store',
            });

            if (!response.ok) {
              return {
                data: null,
                error: new Error(`Supabase request failed with status ${response.status} ${response.statusText}`),
              };
            }

            const data = (await response.json()) as T;
            return { data, error: null };
          } catch (error) {
            return {
              data: null,
              error:
                error instanceof Error
                  ? error
                  : new Error('Unknown error while attempting to fetch data from Supabase'),
            };
          }
        },
      };
    },
  };
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export function requireSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase client has not been configured.');
  }

  return supabase;
}
