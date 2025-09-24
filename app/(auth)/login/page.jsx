import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Log In | The Chart 2.0",
};

export default function LoginPage() {
  const session = getSession();
  if (session) {
    redirect("/chart");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel w-full max-w-md space-y-8 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Welcome back</h1>
          <p className="text-sm text-slate-400">
            Sign in to continue exploring the latest relationship updates on the chart.
          </p>
        </div>
        <LoginForm />
        <p className="text-sm text-slate-400">
          Need an account?{" "}
          <Link href="/signup" className="font-medium text-sky-400 hover:text-sky-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
