import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { createSupabaseServiceClient } from "@/lib/supabaseServiceClient";

export const dynamic = "force-dynamic";

export async function GET() {
  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch (serviceClientError) {
    try {
      supabase = await createSupabaseRouteClient();
    } catch (routeClientError) {
      const error =
        serviceClientError instanceof Error ? serviceClientError : routeClientError;
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: nodesError.message }, { status: 500 });
  }

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  return NextResponse.json({ nodes: nodes ?? [], links: links ?? [] });
}
