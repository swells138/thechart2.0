import Link from "next/link";

import SignupForm from "./SignupForm";

export const metadata = {
  title: "Sign Up | The Chart 2.0",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel w-full max-w-md space-y-8 p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Create your account</h1>
          <p className="text-sm text-slate-400">
            Sign up to build and explore your relationship network.
          </p>
        </div>
        <SignupForm />
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-sky-400 hover:text-sky-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
