import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.name !== "string" || typeof body.group_type !== "string") {
    return NextResponse.json({ error: "Missing or invalid node payload" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseRouteClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("nodes")
    .insert({
      name: body.name,
      group_type: body.group_type,
      user_id: user.id,
      is_base: body.is_base ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ node: data });
}
