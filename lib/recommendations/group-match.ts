// Group Score = 0.65 * average(personal match) + 0.35 * lowest(personal
// match) — spec §11, explicitly a tunable baseline, not permanent. Ranking
// solely by average can hide one member strongly disliking a movie, so the
// lowest score always pulls the group score down. "Extreme Match" (spec
// §12) shifts weight further toward the least-satisfied member.
const NORMAL_WEIGHTS = { avg: 0.65, min: 0.35 } as const;
const EXTREME_WEIGHTS = { avg: 0.3, min: 0.7 } as const;

export function computeGroupScore(personalMatches: number[], extreme: boolean): number {
  if (personalMatches.length === 0) return 0;
  const avg = personalMatches.reduce((a, b) => a + b, 0) / personalMatches.length;
  const min = Math.min(...personalMatches);
  const weights = extreme ? EXTREME_WEIGHTS : NORMAL_WEIGHTS;
  return Math.round(weights.avg * avg + weights.min * min);
}
