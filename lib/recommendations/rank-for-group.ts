import type { TmdbMovieSummary } from "@/lib/tmdb/types";
import type { TasteProfile } from "./taste-profile";
import { computeMoffyMatch } from "./moffy-match";
import { summaryToMatchable } from "./adapters";
import { computeGroupScore } from "./group-match";

export interface GroupFilters {
  excludeGenreIds: Set<number>;
  minRating: number;
  extreme: boolean;
  excludeMovieIds: Set<number>;
}

export interface RankedCandidate {
  movie: TmdbMovieSummary;
  groupScore: number;
  personalMatches: number[];
}

// Shared by the group recommendations page and pathway generation — both
// need "rank this candidate pool by group score under these filters".
export function rankCandidatesForGroup(
  candidates: TmdbMovieSummary[],
  tasteProfiles: TasteProfile[],
  filters: GroupFilters,
): RankedCandidate[] {
  return candidates
    .filter((c) => !filters.excludeMovieIds.has(c.id))
    .filter((c) => !c.genre_ids.some((g) => filters.excludeGenreIds.has(g)))
    .filter((c) => c.vote_average >= filters.minRating)
    .map((movie) => {
      const matchable = summaryToMatchable(movie);
      const personalMatches = tasteProfiles.map((p) => computeMoffyMatch(p, matchable));
      return {
        movie,
        groupScore: computeGroupScore(personalMatches, filters.extreme),
        personalMatches,
      };
    })
    .sort((a, b) => b.groupScore - a.groupScore);
}

// Spreads a pathway's picks across the requested genres instead of
// requiring every single movie to match all of them — asking for both
// Horror and Action shouldn't mean "only horror-action hybrids," it
// should mean "mix of horror and action movies" (round-robins the
// highest-ranked still-unpicked match per genre; leftover slots, or all
// of them when no genres are given, fall back to the overall ranking).
export function pickDiverseByGenre(
  ranked: RankedCandidate[],
  genreIds: number[],
  count: number,
): RankedCandidate[] {
  if (genreIds.length === 0) return ranked.slice(0, count);

  const picked: RankedCandidate[] = [];
  const pickedIds = new Set<number>();
  const byGenre = new Map(
    genreIds.map((id) => [id, ranked.filter((c) => c.movie.genre_ids.includes(id))]),
  );

  let genreIndex = 0;
  while (picked.length < count) {
    const before = picked.length;
    for (let i = 0; i < genreIds.length && picked.length < count; i++) {
      const genreId = genreIds[(genreIndex + i) % genreIds.length];
      const candidates = byGenre.get(genreId) ?? [];
      const next = candidates.find((c) => !pickedIds.has(c.movie.id));
      if (next) {
        picked.push(next);
        pickedIds.add(next.movie.id);
      }
    }
    genreIndex += genreIds.length;
    if (picked.length === before) break; // every genre bucket exhausted
  }

  if (picked.length < count) {
    for (const c of ranked) {
      if (picked.length >= count) break;
      if (!pickedIds.has(c.movie.id)) {
        picked.push(c);
        pickedIds.add(c.movie.id);
      }
    }
  }

  return picked.sort((a, b) => b.groupScore - a.groupScore);
}
