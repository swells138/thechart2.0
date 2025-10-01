import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.source !== "string" || typeof body.target !== "string" || typeof body.type !== "string") {
    return NextResponse.json({ error: "Missing or invalid link payload" }, { status: 400 });
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
    .from("links")
    .insert({
      source: body.source,
      target: body.target,
      type: body.type,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link: data });
}
