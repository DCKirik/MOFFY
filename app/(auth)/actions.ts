"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPreAuthLanguage } from "@/lib/i18n/get-language";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);

  // The profiles row itself is created by the handle_new_user trigger
  // (default ui_language 'en') — apply whatever they picked on the
  // Welcome screen's language picker, carried here via a cookie since
  // there's no profile to read a preference from before this point.
  if (data.user) {
    const lang = await getPreAuthLanguage();
    if (lang !== "en") {
      await supabase.from("profiles").update({ ui_language: lang }).eq("id", data.user.id);
    }
  }

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
