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
    // Every request here is pinned to language=en-US (see tmdbFetch), and
    // TMDB's videos endpoint honors that as a language FILTER by default
    // — a French market trailer genuinely exists on TMDB for plenty of
    // titles (confirmed live) but is silently dropped from the response
    // without this. "null" (TMDB's literal string, not JS null) keeps
    // untagged videos too.
    include_video_language: "en,tr,fr,null",
  });
}

// Picks the best trailer to show: official YouTube trailers first (newest
// first), falling back to any YouTube trailer, then any YouTube teaser —
// TMDB's video list isn't sorted and not every title has an official one.
function bestPick(videos: TmdbVideo[]): TmdbVideo | undefined {
  const byNewest = (a: TmdbVideo, b: TmdbVideo) => b.published_at.localeCompare(a.published_at);
  const sorted = [...videos].sort(byNewest);
  const officialTrailers = sorted.filter((v) => v.type === "Trailer" && v.official);
  const anyTrailers = sorted.filter((v) => v.type === "Trailer");
  const teasers = sorted.filter((v) => v.type === "Teaser");
  return officialTrailers[0] ?? anyTrailers[0] ?? teasers[0];
}

export function pickTrailerKey(detail: TmdbMovieDetail): string | null {
  const videos = (detail.videos?.results ?? []).filter((v) => v.site === "YouTube");
  return bestPick(videos)?.key ?? null;
}

export interface LanguageAwareTrailer {
  key: string;
  isDubbed: boolean;
}

// TMDB sometimes carries a separate trailer per market (e.g. a French
// distributor's own YouTube upload, tagged iso_639_1: "fr") alongside the
// original — that's a real dub, not a guess. Falls back to the default
// pick (whatever language that happens to be) when no market-specific one
// exists, and says so via isDubbed so the caller can be honest about it
// rather than silently pretending everything's in the preferred language.
export function pickTrailerForLanguage(
  videos: TmdbVideo[],
  preferredLanguage: string,
): LanguageAwareTrailer | null {
  const youtube = videos.filter((v) => v.site === "YouTube");
  if (preferredLanguage !== "en") {
    const inLanguage = bestPick(youtube.filter((v) => v.iso_639_1 === preferredLanguage));
    if (inLanguage) return { key: inLanguage.key, isDubbed: true };
  }
  const fallback = bestPick(youtube);
  return fallback ? { key: fallback.key, isDubbed: false } : null;
}
