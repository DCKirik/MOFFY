import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPopularMovies } from "@/lib/tmdb/client";
import { computeTasteProfile } from "@/lib/recommendations/taste-profile";
import { rankCandidatesForGroup } from "@/lib/recommendations/rank-for-group";
import { TMDB_GENRES } from "@/lib/tmdb/genres";
import { MovieCard } from "@/components/movie/MovieCard";
import { Card } from "@/components/ui/Card";

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function GroupRecommendationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    excludeGenres?: string | string[];
    minRating?: string;
    extreme?: string;
    nobodyWatched?: string;
  }>;
}) {
  const { id: groupId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
  if (!group) notFound();

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  const memberIds = (memberRows ?? []).map((m) => m.user_id);
  if (!memberIds.includes(user.id)) notFound();

  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", memberIds);
  const memberNames = new Map(
    (memberProfiles ?? []).map((p) => [p.id, p.display_name ?? p.username]),
  );

  const excludeGenreIds = new Set(toArray(sp.excludeGenres).map(Number));
  const minRating = sp.minRating ? Number(sp.minRating) : 0;
  const extreme = sp.extreme === "1";
  const nobodyWatched = sp.nobodyWatched === "1";

  const [candidates, tasteProfiles] = await Promise.all([
    getPopularMovies(),
    Promise.all(memberIds.map((uid) => computeTasteProfile(supabase, uid))),
  ]);

  let excludedByWatch = new Set<number>();
  if (nobodyWatched) {
    const { data: watchedRows } = await supabase
      .from("watch_history")
      .select("movie_id")
      .in("user_id", memberIds)
      .in(
        "movie_id",
        candidates.map((c) => c.id),
      );
    excludedByWatch = new Set((watchedRows ?? []).map((w) => w.movie_id));
  }

  const scored = rankCandidatesForGroup(candidates, tasteProfiles, {
    excludeGenreIds,
    minRating,
    extreme,
    excludeMovieIds: excludedByWatch,
  }).map(({ movie, groupScore, personalMatches }) => {
    const lowest = Math.min(...personalMatches);
    return { movie, groupScore, lowest, lowestMember: memberIds[personalMatches.indexOf(lowest)] };
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-brand-ink">{group.name} — Recommendations</h1>
        <p className="text-sm text-brand-ink/60">
          Balances everyone&apos;s taste — {extreme ? "extreme match mode weights the least-satisfied member heavily" : "65% average / 35% least-satisfied member"}.
        </p>
      </div>

      <Card>
        <form className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-brand-ink/70">Exclude genres</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {TMDB_GENRES.map((g) => (
                <label key={g.id} className="flex items-center gap-1.5 text-sm text-brand-ink/80">
                  <input
                    type="checkbox"
                    name="excludeGenres"
                    value={g.id}
                    defaultChecked={excludeGenreIds.has(g.id)}
                    className="accent-brand-orange"
                  />
                  {g.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-brand-ink/80">
              Minimum rating
              <input
                type="number"
                name="minRating"
                min={0}
                max={10}
                step={0.5}
                defaultValue={sp.minRating ?? ""}
                className="w-20 rounded-lg border border-white/15 bg-brand-surface-2 px-2 py-1 text-brand-ink"
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-brand-ink/80">
              <input type="checkbox" name="nobodyWatched" value="1" defaultChecked={nobodyWatched} className="accent-brand-orange" />
              Nobody has watched
            </label>
            <label className="flex items-center gap-1.5 text-sm text-brand-ink/80">
              <input type="checkbox" name="extreme" value="1" defaultChecked={extreme} className="accent-brand-orange" />
              Extreme Match
            </label>
          </div>
          <button
            type="submit"
            className="cursor-pointer self-start rounded-xl2 bg-brand-yellow px-5 py-2.5 font-semibold text-brand-bg transition-colors hover:bg-brand-yellow-dark"
          >
            Apply Filters
          </button>
        </form>
      </Card>

      {scored.length === 0 ? (
        <p className="text-sm text-brand-ink/50">No movies match these filters — try loosening them.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {scored.slice(0, 20).map(({ movie, groupScore, lowest, lowestMember }) => (
            <div key={movie.id} className="flex flex-col gap-1">
              <MovieCard
                id={movie.id}
                title={movie.title}
                posterPath={movie.poster_path}
                year={movie.release_date?.slice(0, 4)}
                externalRating={movie.vote_average}
                matchPercent={groupScore}
              />
              <p className="w-36 text-xs text-brand-ink/40 sm:w-44">
                Lowest: {lowest}% ({memberNames.get(lowestMember) ?? "member"})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
