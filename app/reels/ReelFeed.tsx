"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/tmdb/image";
import type { ScoredReel } from "@/lib/recommendations/reels";
import { swipeMovie, loadMoreReels } from "./actions";

const LOAD_MORE_THRESHOLD = 4; // fetch more once this many reels remain unseen below the active one

export function ReelFeed({ initialQueue }: { initialQueue: ScoredReel[] }) {
  const [queue, setQueue] = useState(initialQueue);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiped, setSwiped] = useState<Map<number, boolean>>(new Map());
  const [muted, setMuted] = useState(true);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const loadingMoreRef = useRef(false);
  const seenIdsRef = useRef<Set<number>>(new Set(initialQueue.map((r) => r.id)));

  const fetchMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    startTransition(() => {
      loadMoreReels(Array.from(seenIdsRef.current))
        .then((next) => {
          if (next.length > 0) {
            setQueue((prev) => [...prev, ...next]);
            for (const r of next) seenIdsRef.current.add(r.id);
          }
        })
        .finally(() => {
          loadingMoreRef.current = false;
        });
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = slideRefs.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: [0.6] },
    );
    for (const el of slideRefs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [queue.length]);

  useEffect(() => {
    if (queue.length - activeIndex <= LOAD_MORE_THRESHOLD) fetchMore();
  }, [activeIndex, queue.length, fetchMore]);

  function handleSwipe(movieId: number, liked: boolean) {
    if (swiped.has(movieId)) return;
    setSwiped((prev) => new Map(prev).set(movieId, liked));
    startTransition(() => {
      swipeMovie(movieId, liked).catch((err) => console.error("swipe failed", err));
    });
    setTimeout(() => {
      const next = slideRefs.current[activeIndex + 1];
      next?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
  }

  if (queue.length === 0) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-brand-bg px-6 text-center">
        <p className="font-display text-xl text-brand-ink">No more trailers right now</p>
        <p className="text-sm text-brand-ink/60">Rate a few more movies and check back — Moffy learns fast.</p>
        <Link href="/" className="mt-2 rounded-xl2 bg-brand-yellow px-5 py-2.5 font-semibold text-brand-bg">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-dvh w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-black"
    >
      <Link
        href="/"
        aria-label="Close"
        className="fixed left-4 top-4 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/50 text-lg text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        ✕
      </Link>
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="fixed right-4 top-4 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/50 text-lg text-white backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {queue.map((reel, i) => (
        <ReelSlide
          key={reel.id}
          ref={(el) => {
            slideRefs.current[i] = el;
          }}
          reel={reel}
          active={i === activeIndex}
          muted={muted}
          liked={swiped.get(reel.id)}
          onSwipe={(liked) => handleSwipe(reel.id, liked)}
        />
      ))}
    </div>
  );
}

function ReelSlide({
  reel,
  active,
  muted,
  liked,
  onSwipe,
  ref,
}: {
  reel: ScoredReel;
  active: boolean;
  muted: boolean;
  liked: boolean | undefined;
  onSwipe: (liked: boolean) => void;
  ref: (el: HTMLDivElement | null) => void;
}) {
  const backdrop = tmdbImage(reel.backdropPath ?? reel.posterPath, "w780");

  return (
    <div ref={ref} className="relative flex h-dvh w-full snap-start items-center justify-center">
      {backdrop && !active && (
        <Image src={backdrop} alt="" fill className="object-cover opacity-40" sizes="100vw" />
      )}

      {active && (
        <iframe
          key={`${reel.id}-${muted}`}
          src={`https://www.youtube.com/embed/${reel.trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${reel.trailerKey}&controls=0&modestbranding=1&playsinline=1`}
          title={`${reel.title} trailer`}
          allow="accelerometer; autoplay; encrypted-media; gyroscope"
          className="aspect-video w-full max-h-full"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-6 pb-28 sm:pb-6">
        <div className="pointer-events-auto max-w-xl">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-display text-2xl text-white">{reel.title}</span>
            <span className="rounded-full bg-brand-yellow px-3 py-0.5 text-sm font-bold text-brand-bg">
              {Math.round(reel.matchPercent)}% Match
            </span>
          </div>
          <p className="mb-2 text-sm text-white/70">
            {reel.releaseYear ?? ""}
            {reel.externalRating != null ? ` · ★ ${reel.externalRating.toFixed(1)}` : ""}
          </p>
          <p className="line-clamp-2 text-sm text-white/80">{reel.overview}</p>
          <Link href={`/movie/${reel.id}`} className="mt-2 inline-block text-sm font-semibold text-brand-orange hover:underline">
            More info →
          </Link>
        </div>
      </div>

      <div className="absolute bottom-32 right-4 flex flex-col items-center gap-5 sm:bottom-6">
        <button
          type="button"
          onClick={() => onSwipe(true)}
          aria-label="Like"
          className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-2xl backdrop-blur-sm transition-all duration-200 active:scale-90 ${
            liked === true
              ? "bg-brand-orange text-white shadow-[0_0_24px_6px_rgba(225,29,72,0.5)]"
              : "bg-black/50 text-white hover:bg-black/70"
          }`}
        >
          ♥
        </button>
        <button
          type="button"
          onClick={() => onSwipe(false)}
          aria-label="Not interested"
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-xl backdrop-blur-sm transition-all duration-200 active:scale-90 ${
            liked === false
              ? "bg-white/90 text-brand-bg shadow-[0_0_20px_4px_rgba(255,255,255,0.3)]"
              : "bg-black/50 text-white hover:bg-black/70"
          }`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
