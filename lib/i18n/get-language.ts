import "server-only";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { UI_LANGUAGES, type UiLanguage } from "./dictionary";

export async function getUiLanguage(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
): Promise<UiLanguage> {
  if (!userId) return "en";
  const { data } = await supabase.from("profiles").select("ui_language").eq("id", userId).maybeSingle();
  return data?.ui_language ?? "en";
}

export const PRE_AUTH_LANGUAGE_COOKIE = "moffy_lang";

// Before an account exists there's no profile row to read a preference
// from — the Welcome screen's language picker sets this cookie instead,
// which the signup action reads once to seed the new profile's
// ui_language (see app/(auth)/actions.ts).
export async function getPreAuthLanguage(): Promise<UiLanguage> {
  const store = await cookies();
  const value = store.get(PRE_AUTH_LANGUAGE_COOKIE)?.value;
  return UI_LANGUAGES.some((l) => l.code === value) ? (value as UiLanguage) : "en";
}
