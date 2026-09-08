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
