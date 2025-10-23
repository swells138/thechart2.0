"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import LogoutButton from "@/components/LogoutButton";
import { supabase } from "@/lib/supabaseClient";

export default function Header() {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setUserEmail(null);
      return undefined;
    }

    let isMounted = true;

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error fetching current user for header:", error);
        }

        if (!isMounted) {
          return;
        }

        setUserEmail(data?.user?.email ?? null);
      } catch (error) {
        console.error("Unexpected error fetching current user for header:", error);
        if (isMounted) {
          setUserEmail(null);
        }
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-sky-300">
          The Chart 2.0
        </Link>
        {userEmail ? (
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <span className="hidden sm:inline">Signed in as {userEmail}</span>
            <nav className="flex items-center gap-3">
              <Link
                href="/my-chart"
                className="rounded-lg border border-slate-700 px-3 py-2 transition hover:bg-slate-800/80"
              >
                My Chart
              </Link>
              <LogoutButton />
            </nav>
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
