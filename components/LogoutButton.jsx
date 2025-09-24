"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/actions/session";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing out..." : "Log Out"}
    </button>
  );
}

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton />
    </form>
  );
}
