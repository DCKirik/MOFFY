"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { tmdbImage } from "@/lib/tmdb/image";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { rateOnboardingMovie, completeOnboarding } from "./actions";
import { ONBOARDING_MIN_RATINGS } from "@/lib/onboarding/seed-movies";

type SeedMovie = {
  id: number;
  title: string;
  posterPath: string | null;
  year?: string;
};

export function OnboardingGrid({
  movies,
  initialRatings,
}: {
  movies: SeedMovie[];
  initialRatings: Record<number, number>;
}) {
  const [ratings, setRatings] = useState<Record<number, number>>(initialRatings);
  const [isPending, startTransition] = useTransition();
  const ratedCount = Object.values(ratings).filter((r) => r > 0).length;
  const canContinue = ratedCount >= ONBOARDING_MIN_RATINGS;

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
        {movies.map((movie) => (
          <div key={movie.id} className="flex flex-col items-center gap-2">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl2 bg-brand-surface">
              {movie.posterPath ? (
                <Image
                  src={tmdbImage(movie.posterPath, "w342")!}
                  alt={movie.title}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-xs text-brand-ink/50">
                  {movie.title}
                </div>
              )}
            </div>
            <p className="text-center text-sm font-semibold text-brand-ink">{movie.title}</p>
            <StarRating
              rating={ratings[movie.id] ?? 0}
              onRate={(value) => {
                setRatings((prev) => ({ ...prev, [movie.id]: value }));
                startTransition(() => {
                  rateOnboardingMovie(movie.id, value);
                });
              }}
            />
          </div>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-brand-bg/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="text-sm text-brand-ink/70">
            {ratedCount} / {ONBOARDING_MIN_RATINGS}+ rated
          </p>
          <Button
            disabled={!canContinue || isPending}
            onClick={() => startTransition(() => completeOnboarding())}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
