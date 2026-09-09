import "server-only";
import type { TmdbMovieDetail, TmdbMovieSummary, TmdbVideo } from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  revalidateSeconds = 60 * 60 * 24,
): Promise<T> {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, { next: { revalidate: revalidateSeconds } });
  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status}): ${path}`);
  }
  return res.json();
}

export function searchMovies(query: string, page = 1): Promise<TmdbMovieSummary[]> {
  if (!query.trim()) return Promise.resolve([]);
  return tmdbFetch<{ results: TmdbMovieSummary[] }>(
    "/search/movie",
    { query, page: String(page) },
    60 * 10,
  ).then((data) => data.results);
}

export function getPopularMovies(): Promise<TmdbMovieSummary[]> {
  return tmdbFetch<{ results: TmdbMovieSummary[] }>("/movie/popular", {}, 60 * 60).then(
    (data) => data.results,
  );
}

export function getMovieDetail(id: number): Promise<TmdbMovieDetail> {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${id}`, {
    append_to_response: "credits,watch/providers,keywords,videos",
  });
}

// Picks the best trailer to show: official YouTube trailers first (newest
// first), falling back to any YouTube trailer, then any YouTube teaser —
// TMDB's video list isn't sorted and not every title has an official one.
export function pickTrailerKey(detail: TmdbMovieDetail): string | null {
  const byNewest = (a: TmdbVideo, b: TmdbVideo) => b.published_at.localeCompare(a.published_at);
  const videos = (detail.videos?.results ?? []).filter((v) => v.site === "YouTube").sort(byNewest);
  const officialTrailers = videos.filter((v) => v.type === "Trailer" && v.official);
  const anyTrailers = videos.filter((v) => v.type === "Trailer");
  const teasers = videos.filter((v) => v.type === "Teaser");
  const pick = officialTrailers[0] ?? anyTrailers[0] ?? teasers[0];
  return pick?.key ?? null;
}
