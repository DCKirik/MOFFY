import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types/database.types";

export interface TasteProfile {
  genreScores: Map<number, number>;
  directorScores: Map<string, number>;
  actorScores: Map<string, number>;
  ratedMovieIds: Set<number>;
  swipedMovieIds: Set<number>;
  contentOrigin: "domestic" | "foreign" | "both";
}

const EMPTY_PROFILE: TasteProfile = {
  genreScores: new Map(),
  directorScores: new Map(),
  actorScores: new Map(),
  ratedMovieIds: new Set(),
  swipedMovieIds: new Set(),
  contentOrigin: "both",
};

// Onboarding lets a user explicitly pick genres they like, in addition to
// whatever the star ratings imply — mainly so a brand-new account with
// only 5 ratings still gets a reasonable cold-start push toward genres it
// has no rating evidence for yet (spec §3: cold-start reduction). Kept
// well below a real rating's effect (which can reach ±1).
const EXPLICIT_GENRE_BONUS = 0.12;

// A reel swipe (Reels feed, lib/recommendations/reels.ts) is a much
// lighter decision than a deliberate 1-5 star rating — seconds of a
// trailer versus having watched the whole film — so it nudges the taste
// profile at a fraction of a rating's weight. Weighted averaging (below)
// means a handful of swipes can't outweigh a real rating on the same
// genre/director/actor, but a consistent pattern across many swipes still
// moves the profile.
const SWIPE_WEIGHT = 0.35;
const SWIPE_LIKE_SIGNAL = 0.6; // roughly "would rate ~4/5"
const SWIPE_DISLIKE_SIGNAL = -0.6;

// 1..5 stars -> -1..1, centered so a 3-star rating reads as neutral.
function normalizeRating(rating: number): number {
  return (rating - 3) / 2;
}

interface WeightedSum {
  weightedSum: number;
  totalWeight: number;
}

function addSignal<K>(map: Map<K, WeightedSum>, key: K, signal: number, weight: number): void {
  const cur = map.get(key) ?? { weightedSum: 0, totalWeight: 0 };
  cur.weightedSum += signal * weight;
  cur.totalWeight += weight;
  map.set(key, cur);
}

function resolveScores<K>(map: Map<K, WeightedSum>): Map<K, number> {
  return new Map(
    Array.from(map.entries()).map(([k, v]) => [k, v.totalWeight > 0 ? v.weightedSum / v.totalWeight : 0]),
  );
}

// Aggregates a user's star ratings + reel swipes into per-genre/director/
// actor affinity scores (spec §7: taste profile from genres/actors/
// directors/ratings). One query set per call — cache/reuse the result
// across a single page render rather than calling this per movie card.
export async function computeTasteProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TasteProfile> {
  const [{ data: ratings }, { data: swipes }, { data: profile }] = await Promise.all([
    supabase.from("ratings").select("movie_id, rating").eq("user_id", userId),
    supabase.from("reel_swipes").select("movie_id, liked").eq("user_id", userId),
    supabase.from("profiles").select("preferred_genres, content_origin").eq("id", userId).maybeSingle(),
  ]);

  const contentOrigin = profile?.content_origin ?? "both";
  const preferredGenres = profile?.preferred_genres ?? [];

  const ratedMovieIds = new Set((ratings ?? []).map((r) => r.movie_id));
  const swipedMovieIds = new Set((swipes ?? []).map((s) => s.movie_id));
  const allMovieIds = new Set([...ratedMovieIds, ...swipedMovieIds]);

  if (allMovieIds.size === 0) {
    const genreScores = new Map(preferredGenres.map((id) => [id, EXPLICIT_GENRE_BONUS]));
    return { ...EMPTY_PROFILE, genreScores, contentOrigin };
  }

  const { data: movies } = await supabase
    .from("movies_cache")
    .select("tmdb_id, genres, director, cast_members")
    .in("tmdb_id", Array.from(allMovieIds));

  const movieById = new Map((movies ?? []).map((m) => [m.tmdb_id, m]));

  const genreSums = new Map<number, WeightedSum>();
  const directorSums = new Map<string, WeightedSum>();
  const actorSums = new Map<string, WeightedSum>();

  function applySignal(movieId: number, signal: number, weight: number) {
    const movie = movieById.get(movieId);
    if (!movie) return;
    const genres = ((movie.genres as Json[] | null) ?? []) as { id: number; name: string }[];
    for (const g of genres) addSignal(genreSums, g.id, signal, weight);
    if (movie.director) addSignal(directorSums, movie.director, signal, weight);
    const cast = ((movie.cast_members as Json[] | null) ?? []) as { name: string }[];
    for (const c of cast) addSignal(actorSums, c.name, signal, weight);
  }

  for (const r of ratings ?? []) {
    applySignal(r.movie_id, normalizeRating(r.rating), 1);
  }
  for (const s of swipes ?? []) {
    applySignal(s.movie_id, s.liked ? SWIPE_LIKE_SIGNAL : SWIPE_DISLIKE_SIGNAL, SWIPE_WEIGHT);
  }

  const genreScores = resolveScores(genreSums);
  for (const id of preferredGenres) {
    genreScores.set(id, Math.min((genreScores.get(id) ?? 0) + EXPLICIT_GENRE_BONUS, 1));
  }
  const directorScores = resolveScores(directorSums);
  const actorScores = resolveScores(actorSums);

  return { genreScores, directorScores, actorScores, ratedMovieIds, swipedMovieIds, contentOrigin };
}
