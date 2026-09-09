"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/tmdb/image";
import { MatchBadge } from "@/components/ui/MatchBadge";

export interface CarouselItem {
  id: number;
  title: string;
  year?: string;
  backdropPath: string | null;
  externalRating: number | null;
  matchPercent?: number | null;
}

const ADVANCE_MS = 5000;

// Auto-advancing carousel, spec §4: "Large visual carousel... Auto-advances
// without user interaction." Still a plain link per slide, so it degrades
// gracefully (and stays keyboard/screen-reader navigable) with JS off.
export function Carousel({ items }: { items: CarouselItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), ADVANCE_MS);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;
  const item = items[index];
  const backdrop = tmdbImage(item.backdropPath, "w780");

  return (
    <div>
      <Link
        href={`/movie/${item.id}`}
        className="relative block aspect-[16/7] w-full overflow-hidden rounded-xl2 bg-brand-surface"
      >
        {backdrop && (
          <Image src={backdrop} alt={item.title} fill priority className="object-cover" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-lg text-white">{item.title}</p>
              <p className="text-sm text-white/70">
                {item.year}
                {item.externalRating != null ? ` · ★ ${item.externalRating.toFixed(1)}` : ""}
              </p>
            </div>
            {item.matchPercent != null && <MatchBadge percent={item.matchPercent} />}
          </div>
        </div>
      </Link>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-brand-orange" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
