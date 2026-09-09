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
import { LanguageSwitcher } from "./LanguageSwitcher";
import { t } from "@/lib/i18n/dictionary";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/login");
  const lang = profile.ui_language;

  const { data: ratings } = await supabase
    .from("ratings")
    .select("movie_id, rating")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const { data: watchHistory } = await supabase
    .from("watch_history")
    .select("movie_id")
    .eq("user_id", user.id);
  const { data: savedMovies } = await supabase
    .from("saved_movies")
    .select("movie_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const recentRatings = (ratings ?? []).slice(0, 12);
  const recentSaved = (savedMovies ?? []).slice(0, 12);
  const movieIds = Array.from(new Set([...recentRatings.map((r) => r.movie_id), ...recentSaved.map((s) => s.movie_id)]));
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
            <h1 className="font-display text-2xl text-brand-ink">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-sm text-brand-ink/50">@{profile.username}</p>
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            {t(lang, "profile_log_out")}
          </Button>
        </form>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-brand-ink/70">{t(lang, "profile_app_language")}</p>
        <LanguageSwitcher current={lang} />
      </div>

      <div className="flex gap-4">
        <Card className="flex-1 text-center">
          <p className="text-2xl font-bold text-brand-ink">{ratings?.length ?? 0}</p>
          <p className="text-xs uppercase tracking-wide text-brand-ink/50">{t(lang, "profile_rated")}</p>
        </Card>
        <Card className="flex-1 text-center">
          <p className="text-2xl font-bold text-brand-ink">{watchHistory?.length ?? 0}</p>
          <p className="text-xs uppercase tracking-wide text-brand-ink/50">{t(lang, "profile_watched")}</p>
        </Card>
        <Card className="flex-1 text-center">
          <p className="text-2xl font-bold text-brand-ink">{savedMovies?.length ?? 0}</p>
          <p className="text-xs uppercase tracking-wide text-brand-ink/50">{t(lang, "profile_saved")}</p>
        </Card>
      </div>

      {topGenres.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">{t(lang, "profile_your_taste")}</h2>
          <div className="flex flex-wrap gap-2">
            {topGenres.map((g) => (
              <span
                key={g.name}
                className="rounded-full bg-brand-yellow/15 px-3 py-1 text-sm font-semibold text-brand-yellow"
              >
                {g.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {recentRatings.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">{t(lang, "profile_recently_rated")}</h2>
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
        <p className="text-sm text-brand-ink/50">{t(lang, "profile_no_ratings")}</p>
      )}

      {recentSaved.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">{t(lang, "profile_saved")}</h2>
          <div className="flex flex-wrap gap-4">
            {recentSaved.map((s) => {
              const m = movieById.get(s.movie_id);
              if (!m) return null;
              return <MovieCard key={s.movie_id} id={s.movie_id} title={m.title} posterPath={m.poster_path} />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
