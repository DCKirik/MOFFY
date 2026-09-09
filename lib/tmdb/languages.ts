// ISO 639-1 codes for the languages movies_cache actually has meaningful
// coverage of (scripts/seed-movies.mjs seeds Turkish + these explicitly) —
// used for the Discover language filter. Deliberately not the full ISO
// list: an option with near-zero matching movies isn't a useful filter.
export const BROWSE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "tr", name: "Türkçe" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "hi", name: "हिन्दी" },
  { code: "it", name: "Italiano" },
  { code: "zh", name: "中文" },
  { code: "ru", name: "Русский" },
  { code: "pt", name: "Português" },
  { code: "sv", name: "Svenska" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "el", name: "Ελληνικά" },
  { code: "he", name: "עברית" },
  { code: "ar", name: "العربية" },
  { code: "th", name: "ไทย" },
  { code: "id", name: "Indonesia" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
  { code: "fa", name: "فارسی" },
] as const;

export function languageName(code: string | null | undefined): string | null {
  if (!code) return null;
  return BROWSE_LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase();
}
