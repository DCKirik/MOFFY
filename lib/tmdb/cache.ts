import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/types/database.types";
import type { TmdbMovieDetail } from "./types";

// Upserts a full TMDB movie detail payload into movies_cache so its
// tmdb_id can be safely used as a foreign key by ratings/watch_history/
// pathway_movies. Regular users can only SELECT movies_cache (see
// supabase/migrations/20260908000002_rls_policies.sql) — this is the one
// privileged write path, called whenever a movie detail page is viewed.
export async function cacheMovie(detail: TmdbMovieDetail): Promise<void> {
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
    director,
    cast_members: castMembers as unknown as Json,
    overview: detail.overview,
    external_rating: detail.vote_average,
    popularity: detail.popularity,
    cached_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to cache movie ${detail.id}: ${error.message}`);
}
