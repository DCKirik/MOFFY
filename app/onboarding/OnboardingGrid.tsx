"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { tmdbImage } from "@/lib/tmdb/image";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { rateOnboardingMovie, completeOnboarding, type OnboardingPreferences } from "./actions";
import { ONBOARDING_MIN_RATINGS } from "@/lib/onboarding/seed-movies";
import { TMDB_GENRES } from "@/lib/tmdb/genres";

type SeedMovie = {
  id: number;
  title: string;
  posterPath: string | null;
  year?: string;
};

const ORIGIN_OPTIONS: { value: OnboardingPreferences["contentOrigin"]; label: string }[] = [
  { value: "domestic", label: "Mostly Turkish films" },
  { value: "foreign", label: "Mostly foreign films" },
  { value: "both", label: "Both, no preference" },
];

const LANGUAGE_OPTIONS: { value: OnboardingPreferences["watchLanguage"]; label: string }[] = [
  { value: "turkish", label: "Dubbed in Turkish" },
  { value: "subtitled", label: "Subtitled, original audio" },
  { value: "both", label: "Either is fine" },
];

export function OnboardingGrid({
  movies,
  initialRatings,
}: {
  movies: SeedMovie[];
  initialRatings: Record<number, number>;
}) {
  const [ratings, setRatings] = useState<Record<number, number>>(initialRatings);
  const [preferredGenres, setPreferredGenres] = useState<Set<number>>(new Set());
  const [contentOrigin, setContentOrigin] = useState<OnboardingPreferences["contentOrigin"]>("both");
  const [watchLanguage, setWatchLanguage] = useState<OnboardingPreferences["watchLanguage"]>("both");
  const [isPending, startTransition] = useTransition();
  const ratedCount = Object.values(ratings).filter((r) => r > 0).length;
  const canContinue = ratedCount >= ONBOARDING_MIN_RATINGS;

  function toggleGenre(id: number) {
    setPreferredGenres((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-8 pb-24">
      <Card className="flex flex-col gap-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">
            Which genres do you like? (optional)
          </h2>
          <div className="flex flex-wrap gap-2">
            {TMDB_GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  preferredGenres.has(g.id)
                    ? "border-brand-orange bg-brand-orange text-white"
                    : "border-white/15 bg-brand-surface-2 text-brand-ink/80 hover:border-brand-orange/40"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Turkish or foreign films?</h2>
          <div className="flex flex-wrap gap-2">
            {ORIGIN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContentOrigin(opt.value)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  contentOrigin === opt.value
                    ? "border-brand-orange bg-brand-orange text-white"
                    : "border-white/15 bg-brand-surface-2 text-brand-ink/80 hover:border-brand-orange/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">
            For foreign films, how do you like to watch?
          </h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWatchLanguage(opt.value)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  watchLanguage === opt.value
                    ? "border-brand-orange bg-brand-orange text-white"
                    : "border-white/15 bg-brand-surface-2 text-brand-ink/80 hover:border-brand-orange/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
        {movies.map((movie) => (
          <div key={movie.id} className="flex flex-col items-center gap-2">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl2 bg-brand-surface transition-shadow duration-300 shadow-[0_0_14px_1px_rgba(255,199,44,0.10)] hover:shadow-[0_0_26px_5px_rgba(255,199,44,0.30)]">
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
            onClick={() =>
              startTransition(() =>
                completeOnboarding({
                  preferredGenres: Array.from(preferredGenres),
                  contentOrigin,
                  watchLanguage,
                }),
              )
            }
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
