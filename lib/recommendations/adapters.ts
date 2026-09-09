import type { TmdbMovieDetail, TmdbMovieSummary } from "@/lib/tmdb/types";
import type { MatchableMovie } from "./moffy-match";

// Summary results (search/popular) carry genre_ids but not credits, so
// director/actor compatibility can't factor in here — only used for
// ranking candidate lists, never the single "Best Match" hero (see
// detailToMatchable, used once full detail is fetched for that pick).
export function summaryToMatchable(movie: TmdbMovieSummary): MatchableMovie {
  return {
    genres: movie.genre_ids.map((id) => ({ id, name: "" })),
    director: null,
    castNames: [],
    externalRating: movie.vote_average,
    popularity: movie.popularity,
    originalLanguage: movie.original_language ?? null,
  };
}

export function detailToMatchable(detail: TmdbMovieDetail): MatchableMovie {
  return {
    genres: detail.genres,
    director: detail.credits?.crew?.find((c) => c.job === "Director")?.name ?? null,
    castNames: (detail.credits?.cast ?? []).slice(0, 10).map((c) => c.name),
    externalRating: detail.vote_average,
    popularity: detail.popularity,
    originalLanguage: detail.original_language ?? null,
  };
}
