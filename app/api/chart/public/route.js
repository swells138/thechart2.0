import { NextResponse } from "next/server";
import { createSupabaseReadOnlyClient } from "@/lib/supabaseReadOnlyClient";
import { createSupabaseServiceClient } from "@/lib/supabaseServiceClient";
import fallbackChart from "@/data/chart.json";

const FALLBACK_MESSAGE =
  "Showing cached sample data while we reconnect to the live chart.";

function createFallbackResponse(message, status = 200) {
  return NextResponse.json(
    {
      nodes: fallbackChart.nodes,
      links: fallbackChart.links,
      fallback: {
        isFallback: true,
        message: message ?? FALLBACK_MESSAGE,
      },
    },
    { status },
  );
}

export const dynamic = "force-dynamic";

export async function GET() {
  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch (serviceClientError) {
    try {
      supabase = createSupabaseReadOnlyClient();
    } catch (readOnlyClientError) {
      const error =
        serviceClientError instanceof Error ? serviceClientError : readOnlyClientError;
      console.error("Unable to create Supabase client for public chart:", error);
      return createFallbackResponse(error.message);
    }
  }

  const [{ data: nodes, error: nodesError }, { data: links, error: linksError }] = await Promise.all([
    supabase
      .from("nodes")
      .select("id, name, group_type, user_id, is_base")
      .eq("is_base", true),
    supabase
      .from("links")
      .select("id, source, target, type, user_id")
      .is("user_id", null),
  ]);

  if (nodesError) {
    console.error("Unable to load public chart nodes:", nodesError);
    return createFallbackResponse(nodesError.message);
  }

  if (linksError) {
    console.error("Unable to load public chart links:", linksError);
    return createFallbackResponse(linksError.message);
  }

  return NextResponse.json({
    nodes: nodes ?? [],
    links: links ?? [],
    fallback: {
      isFallback: false,
      message: null,
    },
  });
}
