"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";
import { createUser } from "@/lib/auth";

export async function signupAction(prevState, formData) {
  const username = formData.get("username")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!username || !email || !password) {
    return { message: "All fields are required." };
  }

  if (password.length < 6) {
    return { message: "Password must be at least 6 characters long." };
  }

  try {
    const user = await createUser({ username, email, password });
    createSession(user.email);
    redirect("/chart");
  } catch (error) {
    return { message: error.message ?? "Unable to create account." };
  }
}
