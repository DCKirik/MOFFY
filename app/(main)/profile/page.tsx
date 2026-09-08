import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeTasteProfile } from "@/lib/recommendations/taste-profile";
import { TMDB_GENRES } from "@/lib/tmdb/genres";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { MovieCard } from "@/components/movie/MovieCard";
import { signOut } from "@/app/(auth)/actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/login");

  const { data: ratings } = await supabase
    .from("ratings")
    .select("movie_id, rating")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const { data: watchHistory } = await supabase
    .from("watch_history")
    .select("movie_id")
    .eq("user_id", user.id);

  const recentRatings = (ratings ?? []).slice(0, 12);
  const movieIds = recentRatings.map((r) => r.movie_id);
  const { data: movies } =
    movieIds.length > 0
      ? await supabase.from("movies_cache").select("tmdb_id, title, poster_path").in("tmdb_id", movieIds)
      : { data: [] };
  const movieById = new Map((movies ?? []).map((m) => [m.tmdb_id, m]));

  const tasteProfile = await computeTasteProfile(supabase, user.id);
  const topGenres = Array.from(tasteProfile.genreScores.entries())
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, score]) => ({
      name: TMDB_GENRES.find((g) => g.id === id)?.name ?? `Genre ${id}`,
      score,
    }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar url={profile.avatar_url} name={profile.display_name ?? profile.username} size={72} />
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-sm text-brand-ink/50">@{profile.username}</p>
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            Log out
          </Button>
        </form>
      </div>

      <div className="flex gap-4">
        <Card className="flex-1 text-center">
          <p className="text-2xl font-bold text-brand-ink">{ratings?.length ?? 0}</p>
          <p className="text-xs uppercase tracking-wide text-brand-ink/50">Rated</p>
        </Card>
        <Card className="flex-1 text-center">
          <p className="text-2xl font-bold text-brand-ink">{watchHistory?.length ?? 0}</p>
          <p className="text-xs uppercase tracking-wide text-brand-ink/50">Watched</p>
        </Card>
      </div>

      {topGenres.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Your Taste</h2>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((g) => (
              <span
                key={g.name}
                className="rounded-full bg-brand-yellow/40 px-3 py-1 text-sm font-semibold text-brand-ink"
              >
                {g.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {recentRatings.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Recently Rated</h2>
          <div className="flex flex-wrap gap-4">
            {recentRatings.map((r) => {
              const m = movieById.get(r.movie_id);
              if (!m) return null;
              return (
                <div key={r.movie_id} className="flex flex-col gap-1">
                  <MovieCard id={r.movie_id} title={m.title} posterPath={m.poster_path} />
                  <StarRating rating={r.rating} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {recentRatings.length === 0 && (
        <p className="text-sm text-brand-ink/50">
          You haven&apos;t rated any movies yet — search or discover to get started.
        </p>
      )}
    </div>
  );
}
