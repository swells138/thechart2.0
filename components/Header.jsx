import Link from "next/link";
import { findUserByEmail } from "@/lib/auth";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const session = getSession();
  const user = session ? await findUserByEmail(session.email) : null;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-sky-300">
          The Chart 2.0
        </Link>
        {user ? (
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span className="hidden sm:inline">Signed in as {user.username}</span>
            <LogoutButton />
          </div>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 transition hover:bg-slate-800/80"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-sky-400"
            >
              Sign Up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
