import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types/database.types";

export interface TasteProfile {
  genreScores: Map<number, number>;
  directorScores: Map<string, number>;
  actorScores: Map<string, number>;
  ratedMovieIds: Set<number>;
  contentOrigin: "domestic" | "foreign" | "both";
}

const EMPTY_PROFILE: TasteProfile = {
  genreScores: new Map(),
  directorScores: new Map(),
  actorScores: new Map(),
  ratedMovieIds: new Set(),
  contentOrigin: "both",
};

// Onboarding lets a user explicitly pick genres they like, in addition to
// whatever the star ratings imply — mainly so a brand-new account with
// only 5 ratings still gets a reasonable cold-start push toward genres it
// has no rating evidence for yet (spec §3: cold-start reduction). Kept
// well below a real rating's effect (which can reach ±1).
const EXPLICIT_GENRE_BONUS = 0.12;

// 1..5 stars -> -1..1, centered so a 3-star rating reads as neutral.
function normalizeRating(rating: number): number {
  return (rating - 3) / 2;
}

function average(sum: number, count: number): number {
  return count > 0 ? sum / count : 0;
}

// Aggregates a user's star ratings into per-genre/director/actor affinity
// scores (spec §7: taste profile from genres/actors/directors/ratings).
// One query pair per call — cache/reuse the result across a single page
// render rather than calling this per movie card.
export async function computeTasteProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TasteProfile> {
  const [{ data: ratings }, { data: profile }] = await Promise.all([
    supabase.from("ratings").select("movie_id, rating").eq("user_id", userId),
    supabase.from("profiles").select("preferred_genres, content_origin").eq("id", userId).maybeSingle(),
  ]);

  const contentOrigin = profile?.content_origin ?? "both";
  const preferredGenres = profile?.preferred_genres ?? [];

  const ratedMovieIds = new Set((ratings ?? []).map((r) => r.movie_id));
  if (ratedMovieIds.size === 0) {
    const genreScores = new Map(preferredGenres.map((id) => [id, EXPLICIT_GENRE_BONUS]));
    return { ...EMPTY_PROFILE, genreScores, contentOrigin };
  }

  const { data: movies } = await supabase
    .from("movies_cache")
    .select("tmdb_id, genres, director, cast_members")
    .in("tmdb_id", Array.from(ratedMovieIds));

  const movieById = new Map((movies ?? []).map((m) => [m.tmdb_id, m]));

  const genreSums = new Map<number, { sum: number; count: number }>();
  const directorSums = new Map<string, { sum: number; count: number }>();
  const actorSums = new Map<string, { sum: number; count: number }>();

  for (const r of ratings ?? []) {
    const movie = movieById.get(r.movie_id);
    if (!movie) continue;
    const norm = normalizeRating(r.rating);

    const genres = ((movie.genres as Json[] | null) ?? []) as { id: number; name: string }[];
    for (const g of genres) {
      const cur = genreSums.get(g.id) ?? { sum: 0, count: 0 };
      cur.sum += norm;
      cur.count += 1;
      genreSums.set(g.id, cur);
    }

    if (movie.director) {
      const cur = directorSums.get(movie.director) ?? { sum: 0, count: 0 };
      cur.sum += norm;
      cur.count += 1;
      directorSums.set(movie.director, cur);
    }

    const cast = ((movie.cast_members as Json[] | null) ?? []) as { name: string }[];
    for (const c of cast) {
      const cur = actorSums.get(c.name) ?? { sum: 0, count: 0 };
      cur.sum += norm;
      cur.count += 1;
      actorSums.set(c.name, cur);
    }
  }

  const genreScores = new Map(
    Array.from(genreSums.entries()).map(([id, v]) => [id, average(v.sum, v.count)]),
  );
  for (const id of preferredGenres) {
    genreScores.set(id, Math.min((genreScores.get(id) ?? 0) + EXPLICIT_GENRE_BONUS, 1));
  }
  const directorScores = new Map(
    Array.from(directorSums.entries()).map(([name, v]) => [name, average(v.sum, v.count)]),
  );
  const actorScores = new Map(
    Array.from(actorSums.entries()).map(([name, v]) => [name, average(v.sum, v.count)]),
  );

  return { genreScores, directorScores, actorScores, ratedMovieIds, contentOrigin };
}
