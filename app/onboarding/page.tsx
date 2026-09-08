import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMovieDetail } from "@/lib/tmdb/client";
import { cacheMovie } from "@/lib/tmdb/cache";
import { ONBOARDING_MIN_RATINGS, ONBOARDING_SEED_MOVIES } from "@/lib/onboarding/seed-movies";
import { OnboardingGrid } from "./OnboardingGrid";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const details = await Promise.all(ONBOARDING_SEED_MOVIES.map((m) => getMovieDetail(m.id)));
  await Promise.all(details.map((detail) => cacheMovie(detail)));

  const { data: existingRatings } = await supabase
    .from("ratings")
    .select("movie_id, rating")
    .eq("user_id", user.id)
    .in(
      "movie_id",
      ONBOARDING_SEED_MOVIES.map((m) => m.id),
    );

  const initialRatings = Object.fromEntries(
    (existingRatings ?? []).map((r) => [r.movie_id, r.rating]),
  );

  const movies = details.map((detail) => ({
    id: detail.id,
    title: detail.title,
    posterPath: detail.poster_path,
    year: detail.release_date?.slice(0, 4),
  }));

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Rate a few movies</h1>
        <p className="text-brand-ink/60">
          Rate at least {ONBOARDING_MIN_RATINGS} to help Moffy learn your taste — genres, actors,
          and directors you like.
        </p>
      </div>
      <OnboardingGrid movies={movies} initialRatings={initialRatings} />
    </div>
  );
}
