import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/types/database.types";
import type { TmdbMovieDetail } from "./types";

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
      director,
      cast_members: castMembers as unknown as Json,
      overview: detail.overview,
      external_rating: detail.vote_average,
      popularity: detail.popularity,
      original_language: detail.original_language ?? null,
      spoken_languages: (detail.spoken_languages ?? []) as unknown as Json,
      cached_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
  } catch (err) {
    console.error(`cacheMovie(${detail.id}) failed — is SUPABASE_SERVICE_ROLE_KEY set?`, err);
  }
}
