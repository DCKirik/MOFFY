import type { ReelCandidate } from "@/lib/tmdb/cache";
import type { TasteProfile } from "./taste-profile";
import { computeMoffyMatch, type MatchableMovie } from "./moffy-match";

export interface ScoredReel extends ReelCandidate {
  matchPercent: number;
}

function toMatchable(c: ReelCandidate): MatchableMovie {
  return {
    genres: c.genreIds.map((id) => ({ id, name: "" })),
    director: c.director,
    castNames: c.castNames,
    externalRating: c.externalRating,
    popularity: c.popularity,
    originalLanguage: c.originalLanguage,
  };
}

// Builds one queue of trailers for the Reels feed — not a plain ranked
// list. A strict "best match first" ordering would (a) show every user
// closing in on the same handful of movies at the top of their feed, and
// (b) never surface anything the taste profile hasn't already confirmed,
// so it can never learn about genres/directors it has no data on yet.
//
// Instead: score every candidate with the existing Moffy Match engine
// (spec §8 — same formula personal recommendations and pathways use, so
// "why is this in my feed" and "why did Moffy recommend this" stay
// consistent), then draw from the pool with weighted random sampling
// without replacement — score bias makes high matches much likelier to
// be picked, but never impossible for a low scorer to appear. A small,
// separate "exploration" slice draws uniformly from the lower-scoring
// half of the pool on purpose, specifically to keep collecting signal
// (via swipes) on genres/directors the profile is still uncertain about
// — the classic explore/exploit split, kept deliberately simple
// (no contextual bandit / ML model) to match how the rest of the app's
// scoring works: transparent, deterministic given the inputs, no black box.
const SCORE_POWER = 2.4; // higher = more aggressively favors top matches
const EXPLORATION_RATE = 0.18; // fraction of the queue drawn from the exploration slice
const EXPLORATION_POOL_FRACTION = 0.5; // "lower half by score" = the exploration draw pool

export function buildReelQueue(candidates: ReelCandidate[], profile: TasteProfile, count: number): ScoredReel[] {
  const scored: ScoredReel[] = candidates.map((c) => ({
    ...c,
    matchPercent: computeMoffyMatch(profile, toMatchable(c)),
  }));

  const pool = [...scored];
  const queue: ScoredReel[] = [];

  while (queue.length < count && pool.length > 0) {
    const explore = Math.random() < EXPLORATION_RATE;
    const index = explore ? pickExploration(pool) : pickWeighted(pool);
    queue.push(pool[index]);
    pool.splice(index, 1);
  }

  return queue;
}

function pickWeighted(pool: ScoredReel[]): number {
  const weights = pool.map((c) => Math.pow(Math.max(c.matchPercent, 1), SCORE_POWER));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return pool.length - 1;
}

function pickExploration(pool: ScoredReel[]): number {
  const byScore = pool.map((c, i) => [c.matchPercent, i] as const).sort((a, b) => a[0] - b[0]);
  const cutoff = Math.max(1, Math.ceil(byScore.length * EXPLORATION_POOL_FRACTION));
  const lowerHalf = byScore.slice(0, cutoff);
  return lowerHalf[Math.floor(Math.random() * lowerHalf.length)][1];
}
