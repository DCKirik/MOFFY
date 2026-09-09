import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/types/database.types";
import type { TmdbMovieDetail, TmdbMovieSummary } from "./types";
import { pickTrailerKey } from "./client";

type MoviesCacheRow = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: number | null;
  genres: Json;
  overview: string | null;
  external_rating: number | null;
  popularity: number | null;
  original_language: string | null;
};

function rowToSummary(row: MoviesCacheRow): TmdbMovieSummary {
  return {
    id: row.tmdb_id,
    title: row.title,
    poster_path: row.poster_path,
    backdrop_path: row.backdrop_path,
    release_date: row.release_year ? `${row.release_year}-01-01` : "",
    vote_average: row.external_rating ?? 0,
    vote_count: 0,
    overview: row.overview ?? "",
    popularity: row.popularity ?? 0,
    genre_ids: ((row.genres as { id: number }[] | null) ?? []).map((g) => g.id),
    original_language: row.original_language ?? undefined,
  };
}

const POOL_COLUMNS =
  "tmdb_id, title, poster_path, backdrop_path, release_year, genres, overview, external_rating, popularity, original_language";

// title + keyword names + studio names, lowercased — lets a query like
// "marvel" or "mcu" match Avengers even though neither word is in the
// title (keyword "based on comic" / studio "Marvel Studios" are).
export function buildSearchBlob(detail: TmdbMovieDetail): string {
  const parts = [
    detail.title,
    ...(detail.keywords?.keywords ?? []).map((k) => k.name),
    ...(detail.production_companies ?? []).map((c) => c.name),
  ];
  return parts.join(" ").toLowerCase();
}

// Upserts a full TMDB movie detail payload into movies_cache so its
// tmdb_id can be safely used as a foreign key by ratings/watch_history/
// pathway_movies. Regular users can only SELECT movies_cache (see
// supabase/migrations/20260908000002_rls_policies.sql) — this is the one
// privileged write path, called whenever a movie detail page is viewed.
//
// Deliberately swallows failures (missing/invalid SUPABASE_SERVICE_ROLE_KEY,
// network hiccup, etc.) instead of throwing: every page that renders a
// movie calls this, so a caching failure should degrade to "ratings on
// this movie won't work yet" rather than crash the whole page. Logged
// server-side so it's visible in Vercel's logs without being silent.
export async function cacheMovie(detail: TmdbMovieDetail): Promise<void> {
  try {
    const admin = createAdminClient();
    const director = detail.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;
    const castMembers = (detail.credits?.cast ?? [])
      .slice(0, 10)
      .map((c) => ({ name: c.name, character: c.character }));

    const { error } = await admin.from("movies_cache").upsert({
      tmdb_id: detail.id,
      title: detail.title,
      poster_path: detail.poster_path,
      backdrop_path: detail.backdrop_path,
      release_year: detail.release_date ? Number(detail.release_date.slice(0, 4)) : null,
      runtime: detail.runtime,
      genres: detail.genres as unknown as Json,
      genre_ids: detail.genres.map((g) => g.id),
      director,
      cast_members: castMembers as unknown as Json,
      overview: detail.overview,
      external_rating: detail.vote_average,
      popularity: detail.popularity,
      original_language: detail.original_language ?? null,
      spoken_languages: (detail.spoken_languages ?? []) as unknown as Json,
      keywords: (detail.keywords?.keywords ?? []) as unknown as Json,
      production_companies: (detail.production_companies ?? []) as unknown as Json,
      search_blob: buildSearchBlob(detail),
      trailer_key: pickTrailerKey(detail),
      cached_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
  } catch (err) {
    console.error(`cacheMovie(${detail.id}) failed — is SUPABASE_SERVICE_ROLE_KEY set?`, err);
  }
}

// The actual browse/recommendation candidate pool. Recommendations,
// Discover, and pathway generation all rank/list from this — not a live
// single-page TMDB call — so the ~4300-title cache (scripts/seed-movies.mjs)
// is what users actually see, not just a lookup table for foreign keys.
// Public SELECT per RLS, so this takes the normal request-scoped client,
// not the admin one.
export async function getMoviePool(
  supabase: SupabaseClient<Database>,
  limit = 1000,
): Promise<TmdbMovieSummary[]> {
  const { data, error } = await supabase
    .from("movies_cache")
    .select(POOL_COLUMNS)
    .order("popularity", { ascending: false })
    .limit(limit);

  if (error) console.error("getMoviePool failed:", error.message);
  return (data ?? []).map(rowToSummary);
}

// Page-by-page variant for infinite scroll (Discover). 1-indexed to match
// TMDB's own paging convention, which the same InfiniteMovieGrid also
// drives for Search.
export async function getMoviePoolPage(
  supabase: SupabaseClient<Database>,
  page: number,
  pageSize = 40,
  genreId?: number,
): Promise<TmdbMovieSummary[]> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase.from("movies_cache").select(POOL_COLUMNS).order("popularity", { ascending: false });
  if (genreId != null) {
    query = query.overlaps("genre_ids", [genreId]);
  }
  const { data, error } = await query.range(from, to);
  if (error) console.error("getMoviePoolPage failed:", error.message);
  return (data ?? []).map(rowToSummary);
}

export interface ReelCandidate {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  trailerKey: string;
  overview: string;
  releaseYear: number | null;
  externalRating: number | null;
  genreIds: number[];
  director: string | null;
  castNames: string[];
  originalLanguage: string | null;
  popularity: number | null;
}

// Candidate pool for the Reels trailer feed (lib/recommendations/reels.ts)
// — only movies with a known trailer, excluding whatever the caller has
// already rated/swiped. Includes director/cast (movies_cache already has
// them from the same detail fetch that resolved trailer_key) so reel
// scoring gets the same signal quality as a full movie-detail match, not
// just genre_ids like the lighter TmdbMovieSummary-based pools above.
export async function getReelCandidatePool(
  supabase: SupabaseClient<Database>,
  excludeIds: Set<number>,
  limit = 600,
): Promise<ReelCandidate[]> {
  const { data, error } = await supabase
    .from("movies_cache")
    .select(
      "tmdb_id, title, poster_path, backdrop_path, trailer_key, overview, release_year, external_rating, genre_ids, director, cast_members, original_language, popularity",
    )
    .not("trailer_key", "is", null)
    .order("popularity", { ascending: false })
    .limit(limit);

  if (error) console.error("getReelCandidatePool failed:", error.message);
  return (data ?? [])
    .filter((row) => row.trailer_key && !excludeIds.has(row.tmdb_id))
    .map((row) => ({
      id: row.tmdb_id,
      title: row.title,
      posterPath: row.poster_path,
      backdropPath: row.backdrop_path,
      trailerKey: row.trailer_key!,
      overview: row.overview ?? "",
      releaseYear: row.release_year,
      externalRating: row.external_rating,
      genreIds: row.genre_ids,
      director: row.director,
      castNames: ((row.cast_members as { name: string }[] | null) ?? []).map((c) => c.name),
      originalLanguage: row.original_language,
      popularity: row.popularity,
    }));
}

// Title/keyword/studio search against the cache (see buildSearchBlob) —
// instant (no TMDB round trip), which is what makes it cheap enough to
// call on every keystroke for autocomplete as well as full search paging.
export async function searchMoviePool(
  supabase: SupabaseClient<Database>,
  query: string,
  page = 1,
  pageSize = 40,
  genreId?: number,
): Promise<TmdbMovieSummary[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let dbQuery = supabase
    .from("movies_cache")
    .select(POOL_COLUMNS)
    .ilike("search_blob", `%${q}%`)
    .order("popularity", { ascending: false });
  if (genreId != null) {
    dbQuery = dbQuery.overlaps("genre_ids", [genreId]);
  }
  const { data, error } = await dbQuery.range(from, to);
  if (error) console.error("searchMoviePool failed:", error.message);
  return (data ?? []).map(rowToSummary);
}
