"use client";

import { useState, useTransition } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { rateMovie } from "./actions";

export function RatingControl({
  movieId,
  initialRating,
}: {
  movieId: number;
  initialRating: number;
}) {
  const [rating, setRating] = useState(initialRating);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <StarRating
        rating={rating}
        onRate={(value) => {
          setRating(value);
          startTransition(() => {
            rateMovie(movieId, value);
          });
        }}
      />
      {isPending && <span className="text-xs text-brand-ink/40">Saving…</span>}
    </div>
  );
}
