import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "tc2_session";
const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

export function createSession(email) {
  const store = cookies();
  store.set({
    name: SESSION_COOKIE_NAME,
    value: email,
    httpOnly: true,
    maxAge: WEEK_IN_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function getSession() {
  const value = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!value) {
    return null;
  }

  return { email: value };
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
