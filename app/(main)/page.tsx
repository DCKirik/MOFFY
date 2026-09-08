import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPopularMovies, getMovieDetail } from "@/lib/tmdb/client";
import { cacheMovie } from "@/lib/tmdb/cache";
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

  const [popular, profile] = await Promise.all([
    getPopularMovies(),
    computeTasteProfile(supabase, user.id),
  ]);

  const scoredCandidates = popular
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
        <h2 className="mb-3 text-lg font-bold text-brand-ink">This Week&apos;s Popular Movies</h2>
        <Carousel items={carouselItems} />
      </section>

      {bestMatchDetail && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-brand-ink">Your Best Match</h2>
          <Link
            href={`/movie/${bestMatchDetail.id}`}
            className="flex gap-4 rounded-xl2 border border-black/5 bg-white p-4 shadow-sm hover:shadow-md"
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
            <div className="flex flex-col justify-center gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-bold text-brand-ink">{bestMatchDetail.title}</span>
                {bestMatchScore != null && <MatchBadge percent={bestMatchScore} />}
              </div>
              <p className="text-sm text-brand-ink/60">{bestMatchReason}</p>
            </div>
          </Link>
        </section>
      )}

      {recommended.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-brand-ink">Recommended For You</h2>
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
