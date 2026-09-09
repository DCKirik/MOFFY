"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  // Email confirmation is on (Supabase default): signUp succeeds but issues
  // no session until the user clicks the link in their inbox. Redirecting
  // straight to "/" would just bounce them back to /login with no
  // explanation, via the proxy's auth guard.
  if (!data.session) {
    redirect(`/login?notice=${encodeURIComponent("Check your email to confirm your account, then log in.")}`);
  }
  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
