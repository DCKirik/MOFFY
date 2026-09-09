"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { UiLanguage } from "@/lib/i18n/dictionary";
import { PRE_AUTH_LANGUAGE_COOKIE } from "@/lib/i18n/get-language";

export async function setPreAuthLanguage(lang: UiLanguage) {
  const store = await cookies();
  store.set(PRE_AUTH_LANGUAGE_COOKIE, lang, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/welcome");
  revalidatePath("/login");
  revalidatePath("/signup");
}
