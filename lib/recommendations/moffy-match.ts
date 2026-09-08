import type { TasteProfile } from "./taste-profile";

export interface MatchableMovie {
  genres: { id: number; name: string }[] | null;
  director: string | null;
  castNames: string[];
  externalRating: number | null;
  popularity: number | null;
}

// Personal Match = Genre + Director + Actor + Similar-movie + Community
// Quality + Popularity (spec §8), deterministic, no LLM. "Similar Movie
// Compatibility" is realized as this same content signal (genre+director+
// actor) rather than a separate embeddings lookup — that's what
// content-based similarity actually is without a vector index, and
// building one is out of scope for the MVP. Weights are a documented
// starting point, not a permanent formula (spec explicitly allows this
// for the group formula; the same spirit applies here).
const CONTENT_WEIGHTS = { genre: 0.55, director: 0.25, actor: 0.2 } as const;
const FINAL_WEIGHTS = { content: 0.55, community: 0.25, popularity: 0.2 } as const;
const POPULARITY_SCALE = Math.log10(1000);

function averageOrZero(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function computeMoffyMatch(profile: TasteProfile, movie: MatchableMovie): number {
  const genreScore = averageOrZero(
    (movie.genres ?? [])
      .map((g) => profile.genreScores.get(g.id))
      .filter((v): v is number => v != null),
  );
  const directorScore = movie.director ? (profile.directorScores.get(movie.director) ?? 0) : 0;
  const actorScore = averageOrZero(
    movie.castNames.map((name) => profile.actorScores.get(name)).filter((v): v is number => v != null),
  );

  const contentScore =
    CONTENT_WEIGHTS.genre * genreScore +
    CONTENT_WEIGHTS.director * directorScore +
    CONTENT_WEIGHTS.actor * actorScore;

  const communityQuality = movie.externalRating != null ? movie.externalRating / 10 : 0.5;
  const popularitySignal =
    movie.popularity != null
      ? Math.min(Math.log10(movie.popularity + 1) / POPULARITY_SCALE, 1)
      : 0;

  const match01 =
    FINAL_WEIGHTS.content * ((contentScore + 1) / 2) +
    FINAL_WEIGHTS.community * communityQuality +
    FINAL_WEIGHTS.popularity * popularitySignal;

  return Math.round(Math.min(Math.max(match01, 0), 1) * 100);
}

export function matchReason(profile: TasteProfile, movie: MatchableMovie): string {
  const topGenre = [...(movie.genres ?? [])]
    .map((g) => ({ name: g.name, score: profile.genreScores.get(g.id) ?? 0 }))
    .sort((a, b) => b.score - a.score)[0];

  if (topGenre && topGenre.score > 0.15) {
    return `Because you love ${topGenre.name}`;
  }
  if (movie.director && (profile.directorScores.get(movie.director) ?? 0) > 0.15) {
    return `Because you love films by ${movie.director}`;
  }
  return "Popular and well reviewed";
}
