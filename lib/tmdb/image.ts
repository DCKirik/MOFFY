type ImageSize = "w92" | "w200" | "w342" | "w500" | "w780" | "original";

// Pure string formatting, no secrets — safe to import from client or
// server components, unlike lib/tmdb/client.ts (which is server-only).
export function tmdbImage(path: string | null, size: ImageSize = "w500"): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
