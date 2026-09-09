import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPopularMovies, getMovieDetail } from "@/lib/tmdb/client";
import { cacheMovie, getMoviePool } from "@/lib/tmdb/cache";
import { tmdbImage } from "@/lib/tmdb/image";
import { createClient } from "@/lib/supabase/server";
import { computeTasteProfile } from "@/lib/recommendations/taste-profile";
import { computeMoffyMatch, matchReason } from "@/lib/recommendations/moffy-match";
import { summaryToMatchable, detailToMatchable } from "@/lib/recommendations/adapters";
import { Carousel } from "@/components/movie/Carousel";
import { MovieCard } from "@/components/movie/MovieCard";
import { MatchBadge } from "@/components/ui/MatchBadge";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [popular, pool, profile] = await Promise.all([
    getPopularMovies(),
    getMoviePool(supabase),
    computeTasteProfile(supabase, user.id),
  ]);

  const scoredCandidates = pool
    .filter((m) => !profile.ratedMovieIds.has(m.id))
    .map((movie) => ({ movie, match: computeMoffyMatch(profile, summaryToMatchable(movie)) }))
    .sort((a, b) => b.match - a.match);

  const bestCandidate = scoredCandidates[0];
  let bestMatchDetail = null;
  let bestMatchScore: number | null = null;
  let bestMatchReason = "";

  if (bestCandidate) {
    bestMatchDetail = await getMovieDetail(bestCandidate.movie.id);
    await cacheMovie(bestMatchDetail);
    const matchable = detailToMatchable(bestMatchDetail);
    bestMatchScore = computeMoffyMatch(profile, matchable);
    bestMatchReason = matchReason(profile, matchable);
  }

  const recommended = scoredCandidates.filter((c) => c.movie.id !== bestCandidate?.movie.id).slice(0, 8);

  const carouselItems = popular.slice(0, 5).map((movie) => ({
    id: movie.id,
    title: movie.title,
    year: movie.release_date?.slice(0, 4),
    backdropPath: movie.backdrop_path,
    externalRating: movie.vote_average,
    matchPercent: computeMoffyMatch(profile, summaryToMatchable(movie)),
  }));

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-3 font-display text-lg text-brand-ink">This Week&apos;s Popular Movies</h2>
        <Carousel items={carouselItems} />
      </section>

      {bestMatchDetail && (
        <section>
          <h2 className="mb-3 font-display text-lg text-brand-ink">Your Best Match</h2>
          <Link
            href={`/movie/${bestMatchDetail.id}`}
            className="flex gap-4 rounded-xl2 border border-white/10 bg-brand-surface p-4 transition-all duration-300 shadow-[0_0_18px_2px_rgba(255,199,44,0.10),0_10px_25px_-5px_rgba(0,0,0,0.35)] hover:border-brand-orange/40 hover:shadow-[0_0_34px_8px_rgba(255,199,44,0.28),0_14px_30px_-5px_rgba(0,0,0,0.4)]"
          >
            {tmdbImage(bestMatchDetail.poster_path, "w200") && (
              <Image
                src={tmdbImage(bestMatchDetail.poster_path, "w200")!}
                alt={bestMatchDetail.title}
                width={100}
                height={150}
                className="rounded-lg object-cover"
              />
            )}
            <div className="flex min-w-0 flex-col justify-center gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xl text-brand-ink">{bestMatchDetail.title}</span>
                {bestMatchScore != null && <MatchBadge percent={bestMatchScore} />}
              </div>
              <p className="text-sm text-brand-ink/60">{bestMatchReason}</p>
            </div>
          </Link>
        </section>
      )}

      {recommended.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-brand-ink">Recommended For You</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recommended.map(({ movie, match }) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                posterPath={movie.poster_path}
                year={movie.release_date?.slice(0, 4)}
                externalRating={movie.vote_average}
                matchPercent={match}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
