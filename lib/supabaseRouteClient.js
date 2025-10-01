import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const COOKIE_TOKEN_KEYS = [
  "access_token",
  "accessToken",
  "access-token",
];

const COOKIE_REFRESH_KEYS = [
  "refresh_token",
  "refreshToken",
  "refresh-token",
];

function getProjectRef(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.split(".")[0];
  } catch (error) {
    console.error("Failed to parse Supabase project ref", error);
    return null;
  }
}

function extractToken(candidate, possibleKeys) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  for (const key of possibleKeys) {
    if (typeof candidate[key] === "string" && candidate[key]) {
      return candidate[key];
    }
  }

  return null;
}

function readSessionTokens(cookieValue) {
  try {
    const parsed = JSON.parse(cookieValue);
    const candidates = [parsed, parsed?.currentSession, parsed?.session];

    for (const candidate of candidates) {
      const accessToken = extractToken(candidate, COOKIE_TOKEN_KEYS);
      const refreshToken = extractToken(candidate, COOKIE_REFRESH_KEYS);

      if (accessToken && refreshToken) {
        return { accessToken, refreshToken };
      }
    }
  } catch (error) {
    console.error("Failed to parse Supabase auth cookie", error);
  }

  return { accessToken: null, refreshToken: null };
}

export async function createSupabaseRouteClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const cookieStore = cookies();
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const projectRef = getProjectRef(SUPABASE_URL);

  if (projectRef) {
    const authCookie = cookieStore.get(`sb-${projectRef}-auth-token`);

    if (authCookie?.value) {
      const { accessToken, refreshToken } = readSessionTokens(authCookie.value);

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Failed to restore Supabase session from cookies", error);
        }
      }
    }
  }

  return supabase;
}
