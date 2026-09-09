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
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = rating >= star ? "full" : rating >= star - 0.5 ? "half" : "empty";
        return (
          <div key={star} className="relative text-2xl leading-none">
            <span className="text-white/15">★</span>
            <span
              className={cn(
                "absolute inset-0 overflow-hidden text-brand-yellow",
                fill === "full" && "w-full",
                fill === "half" && "w-1/2",
                fill === "empty" && "w-0",
              )}
            >
              ★
            </span>
            {onRate && (
              <>
                <button
                  type="button"
                  role="radio"
                  aria-checked={fill === "half"}
                  aria-label={`Rate ${star - 0.5} stars`}
                  onClick={() => onRate(star - 0.5)}
                  className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                />
                <button
                  type="button"
                  role="radio"
                  aria-checked={fill === "full"}
                  aria-label={`Rate ${star} stars`}
                  onClick={() => onRate(star)}
                  className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
