import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "Welcome | The Chart 2.0",
};

export default function HomePage() {
  const session = getSession();
  if (session) {
    redirect("/chart");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-100">
          Map every relationship with clarity.
        </h1>
        <p className="text-lg text-slate-400">
          The Chart 2.0 helps you visualize the web of connections in your life with an
          intuitive, interactive graph. Sign up to start exploring the network.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="rounded-xl bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-slate-700 px-6 py-3 text-base font-medium text-slate-200 transition hover:bg-slate-800"
        >
          Log in instead
        </Link>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-left shadow-lg">
        <h2 className="text-lg font-medium text-slate-200">Why The Chart 2.0?</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-400">
          <li>• Rich relationship types with instant filtering.</li>
          <li>• Intelligent search to jump directly to the person you need.</li>
          <li>• Built with Next.js App Router, ready for production data stores.</li>
        </ul>
      </div>
    </div>
  );
}
