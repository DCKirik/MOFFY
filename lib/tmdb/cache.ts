import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/types/database.types";
import type { TmdbMovieDetail, TmdbMovieSummary } from "./types";

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
  const { data } = await supabase
    .from("movies_cache")
    .select(POOL_COLUMNS)
    .order("popularity", { ascending: false })
    .limit(limit);

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
  const { data } = await query.range(from, to);
  return (data ?? []).map(rowToSummary);
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
  const { data } = await dbQuery.range(from, to);
  return (data ?? []).map(rowToSummary);
}
