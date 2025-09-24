"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLogout = async () => {
    setErrorMessage(null);
    setIsSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error while signing out:", error);
        setErrorMessage("Unable to sign out. Please try again.");
        return;
      }

      router.replace("/login");
    } catch (error) {
      console.error("Unexpected error while signing out:", error);
      setErrorMessage("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSigningOut}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningOut ? "Signing out..." : "Log Out"}
      </button>
      {errorMessage ? <span className="text-xs text-rose-400">{errorMessage}</span> : null}
    </div>
  );
}
