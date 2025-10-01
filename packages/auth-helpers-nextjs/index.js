import { createClient } from "@supabase/supabase-js";

function getProjectRef(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.split(".")[0] ?? null;
  } catch (error) {
    console.error("[auth-helpers] Failed to derive Supabase project ref", error);
    return null;
  }
}

function writeSessionCookie(session, supabaseUrl, cookieOptions = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const projectRef = getProjectRef(supabaseUrl);
  if (!projectRef) {
    return;
  }

  const cookieName = `sb-${projectRef}-auth-token`;

  if (!session?.access_token || !session?.refresh_token) {
    document.cookie = `${cookieName}=; Path=/; Max-Age=0`;
    return;
  }

  const payload = encodeURIComponent(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
  );

  const maxAge = cookieOptions.maxAge ?? 60 * 60 * 24 * 7;
  const sameSite = cookieOptions.sameSite ?? "Lax";
  const secure =
    cookieOptions.secure ??
    (typeof window !== "undefined" && window.location.protocol === "https:");

  document.cookie = `${cookieName}=${payload}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}` +
    (secure ? "; Secure" : "");
}

function syncBrowserSession(client, supabaseUrl, cookieOptions) {
  client.auth.getSession().then(({ data }) => {
    writeSessionCookie(data?.session ?? null, supabaseUrl, cookieOptions);
  });

  client.auth.onAuthStateChange((_event, session) => {
    writeSessionCookie(session ?? null, supabaseUrl, cookieOptions);
  });
}

export function createBrowserClient(
  supabaseUrl,
  supabaseKey,
  { supabaseOptions = {}, cookieOptions = {} } = {},
) {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    ...supabaseOptions,
  });

  if (typeof window !== "undefined") {
    syncBrowserSession(client, supabaseUrl, cookieOptions);
  }

  return client;
}

function readSessionCookie(cookieStore, supabaseUrl) {
  const projectRef = getProjectRef(supabaseUrl);
  if (!projectRef) {
    return { access_token: null, refresh_token: null };
  }

  const cookieName = `sb-${projectRef}-auth-token`;
  const rawValue = cookieStore.get?.(cookieName)?.value;

  if (!rawValue) {
    return { access_token: null, refresh_token: null };
  }

  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded);
    if (parsed?.access_token && parsed?.refresh_token) {
      return {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
      };
    }
  } catch (error) {
    console.error("[auth-helpers] Failed to parse Supabase session cookie", error);
  }

  return { access_token: null, refresh_token: null };
}

export function createRouteHandlerClient(
  context,
  { supabaseUrl, supabaseKey, supabaseOptions = {} } = {},
) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not configured.");
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    ...supabaseOptions,
  });

  let cookieStore = context?.cookies;
  if (typeof cookieStore === "function") {
    try {
      cookieStore = cookieStore();
    } catch (error) {
      console.error("[auth-helpers] Failed to read cookies in route handler", error);
      cookieStore = null;
    }
  }

  if (!cookieStore) {
    return client;
  }

  const tokens = readSessionCookie(cookieStore, supabaseUrl);

  if (tokens.access_token && tokens.refresh_token) {
    client.auth
      .setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      })
      .catch((error) => {
        console.error("[auth-helpers] Failed to restore Supabase session", error);
      });
  }

  return client;
}
