"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function rateOnboardingMovie(movieId: number, rating: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("ratings")
    .upsert({ user_id: user.id, movie_id: movieId, rating }, { onConflict: "user_id,movie_id" });

  if (error) throw new Error(error.message);
}

export interface OnboardingPreferences {
  preferredGenres: number[];
  contentOrigin: "domestic" | "foreign" | "both";
  watchLanguage: "turkish" | "subtitled" | "both";
}

export async function completeOnboarding(prefs: OnboardingPreferences) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      preferred_genres: prefs.preferredGenres,
      content_origin: prefs.contentOrigin,
      watch_language: prefs.watchLanguage,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  redirect("/");
}
