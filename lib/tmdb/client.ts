import "server-only";
import type { TmdbMovieDetail, TmdbMovieSummary } from "./types";

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
    append_to_response: "credits,watch/providers",
  });
}
