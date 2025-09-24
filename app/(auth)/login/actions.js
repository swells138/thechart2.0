"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";
import { verifyUser } from "@/lib/auth";

export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { message: "Email and password are required." };
  }

  const user = await verifyUser({ email, password });

  if (!user) {
    return { message: "Invalid email or password." };
  }

  createSession(user.email);
  redirect("/chart");
}
