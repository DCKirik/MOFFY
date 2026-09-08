"use client";

import { cn } from "@/lib/utils/cn";

export function StarRating({
  rating,
  onRate,
}: {
  rating: number;
  onRate?: (value: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating >= star}
          disabled={!onRate}
          onClick={() => onRate?.(star)}
          className={cn(
            "text-2xl leading-none",
            rating >= star ? "text-brand-orange" : "text-black/15",
            onRate && "cursor-pointer",
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
