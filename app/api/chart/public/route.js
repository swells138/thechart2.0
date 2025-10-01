import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const [{ data: nodes, error: nodesError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from("nodes").select("id, name, group_type, user_id, is_base"),
    supabase.from("links").select("id, source, target, type, user_id"),
  ]);

  if (nodesError) {
    return NextResponse.json({ error: nodesError.message }, { status: 500 });
  }

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  return NextResponse.json({ nodes: nodes ?? [], links: links ?? [] });
}
