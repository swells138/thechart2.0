import fallbackChartData from "@/data/chart.json";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasSupabaseCredentials = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function fetchSupabase(endpoint, params = {}) {
  if (!hasSupabaseCredentials) {
    throw new Error("Supabase credentials are not configured");
  }

  const url = new URL(`/rest/v1/${endpoint}`, SUPABASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed for ${endpoint}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getChartData() {
  if (!hasSupabaseCredentials) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Using fallback chart data instead."
      );
    }

    return {
      nodes: fallbackChartData.nodes.map((node) => ({ ...node })),
      links: fallbackChartData.links.map((link) => ({ ...link })),
    };
  }

  const [nodeRows, linkRows] = await Promise.all([
    fetchSupabase("nodes", { select: "name,group_type" }),
    fetchSupabase("links", { select: "source,target,type" }),
  ]);

  const nodes = nodeRows
    .filter((row) => row?.name && row?.group_type)
    .map((row) => ({
      id: row.name,
      group: row.group_type,
    }));

  const links = linkRows
    .filter((row) => row?.source && row?.target && row?.type)
    .map((row) => ({
      source: row.source,
      target: row.target,
      type: row.type,
    }));

  return { nodes, links };
}
