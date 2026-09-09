"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/tmdb/image";
import type { ScoredReel } from "@/lib/recommendations/reels";
import { swipeMovie, loadMoreReels, saveMovie, unsaveMovie } from "./actions";

const LOAD_MORE_THRESHOLD = 4; // fetch more once this many reels remain unseen below the active one
const UNPLAYABLE_TIMEOUT_MS = 6000; // no "playing" state within this long => treat as broken, auto-skip
const TRAILER_START_SECONDS = 2; // skips the near-universal black-frame/logo beat most trailers open on

declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: () => void;
    onError?: (e: { data: number }) => void;
    onStateChange?: (e: { data: number }) => void;
  };
}

interface YTPlayer {
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
}

let youtubeApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

export function ReelFeed({ initialQueue }: { initialQueue: ScoredReel[] }) {
  const [queue, setQueue] = useState(initialQueue);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiped, setSwiped] = useState<Map<number, boolean>>(new Map());
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [muted, setMuted] = useState(true);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const loadingMoreRef = useRef(false);
  const seenIdsRef = useRef<Set<number>>(new Set(initialQueue.map((r) => r.id)));
  // ReelSlide's unplayable timer is created once, when the slide becomes
  // active, and holds onto whatever onUnplayable closure existed at that
  // moment — it never picks up a newer one on later ReelFeed re-renders.
  // Reading activeIndex directly from that stale closure means the
  // freshness check below could compare against a long-outdated value, so
  // handleUnplayable reads this ref instead to always see the current one.
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

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

  // Swiping records the preference — it does NOT advance the feed.
  // Real reels/shorts apps let a like keep playing; the user decides when
  // to move on by scrolling themselves.
  function handleSwipe(movieId: number, liked: boolean) {
    if (swiped.has(movieId)) return;
    setSwiped((prev) => new Map(prev).set(movieId, liked));
    startTransition(() => {
      swipeMovie(movieId, liked).catch((err) => console.error("swipe failed", err));
    });
  }

  function handleSave(movieId: number) {
    const isSaved = saved.has(movieId);
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(movieId);
      else next.add(movieId);
      return next;
    });
    startTransition(() => {
      (isSaved ? unsaveMovie(movieId) : saveMovie(movieId)).catch((err) => console.error("save failed", err));
    });
  }

  // A broken trailer (region-locked, pulled by uploader, etc.) shouldn't
  // strand the user on a dead slide — skip forward automatically, but
  // only for genuinely unplayable content, not on any user action.
  function handleUnplayable(index: number) {
    if (index !== activeIndexRef.current) return;
    const next = slideRefs.current[index + 1];
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          isSaved={saved.has(reel.id)}
          onSwipe={(liked) => handleSwipe(reel.id, liked)}
          onSave={() => handleSave(reel.id)}
          onUnplayable={() => handleUnplayable(i)}
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
  isSaved,
  onSwipe,
  onSave,
  onUnplayable,
  ref,
}: {
  reel: ScoredReel;
  active: boolean;
  muted: boolean;
  liked: boolean | undefined;
  isSaved: boolean;
  onSwipe: (liked: boolean) => void;
  onSave: () => void;
  onUnplayable: () => void;
  ref: (el: HTMLDivElement | null) => void;
}) {
  const backdrop = tmdbImage(reel.backdropPath ?? reel.posterPath, "w780");
  const playerElId = `yt-player-${reel.id}`;
  const playerRef = useRef<YTPlayer | null>(null);
  const unplayableTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      unplayableTimerRef.current = setTimeout(onUnplayable, UNPLAYABLE_TIMEOUT_MS);
      playerRef.current = new window.YT.Player(playerElId, {
        videoId: reel.trailerKey,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: muted ? 1 : 0,
          start: TRAILER_START_SECONDS,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: reel.trailerKey,
          rel: 0,
          iv_load_policy: 3,
        },
        events: {
          onError: () => {
            clearTimeout(unplayableTimerRef.current);
            onUnplayable();
          },
          onStateChange: (e) => {
            if (e.data === 1) clearTimeout(unplayableTimerRef.current); // 1 = playing
            // 0 = ended. loop+playlist should already restart it, but that
            // URL-param trick is flaky in practice — manually seek back
            // and replay so YouTube's own "ended" screen (suggested
            // videos, related channels — not fully suppressible via the
            // embed API) never has a frame to actually render.
            if (e.data === 0) {
              playerRef.current?.seekTo(TRAILER_START_SECONDS, true);
              playerRef.current?.playVideo();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(unplayableTimerRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reel.id]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (muted) playerRef.current.mute();
    else playerRef.current.unMute();
  }, [muted]);

  return (
    <div ref={ref} className="relative flex h-dvh w-full snap-start items-center justify-center">
      {backdrop && !active && (
        <Image src={backdrop} alt="" fill className="object-cover opacity-40" sizes="100vw" />
      )}

      {active && (
        <div className="relative aspect-video w-full max-h-full overflow-hidden">
          {/* YouTube's title/channel bar and bottom control strip (share,
              watch-later, "more videos", the YouTube logo) can no longer be
              suppressed via player params — YouTube dropped modestbranding's
              effect in 2023. Scaling the player past its crop box pushes
              those edge-anchored bars outside the visible frame instead. */}
          <div id={playerElId} className="absolute inset-0 scale-125" />
          {/* Intercepts every tap on the video so the user can never reach
              YouTube's own UI (pause overlay, end-screen suggestions,
              channel branding). Still forwards the tap into a playVideo()
              call through our own player reference — harmless if already
              playing, but the one way to recover a video autoplay failed
              to start, since a real tap on the raw iframe would otherwise
              be swallowed with no way to retry. */}
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={() => playerRef.current?.playVideo()}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/90 via-black/40 to-transparent p-6 pb-28 sm:pb-6">
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
            More info & comments →
          </Link>
        </div>
      </div>

      <div className="absolute bottom-32 right-4 z-20 flex flex-col items-center gap-4 sm:bottom-6">
        <button
          type="button"
          onClick={() => onSwipe(true)}
          aria-label="Like"
          className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-2xl backdrop-blur-sm transition-all duration-200 active:scale-90 ${
            liked === true
              ? "bg-brand-orange text-white shadow-[0_0_24px_6px_rgba(255,106,26,0.5)]"
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
        <button
          type="button"
          onClick={onSave}
          aria-label={isSaved ? "Remove from saved" : "Save"}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-xl backdrop-blur-sm transition-all duration-200 active:scale-90 ${
            isSaved
              ? "bg-brand-yellow text-brand-bg shadow-[0_0_20px_4px_rgba(255,199,44,0.4)]"
              : "bg-black/50 text-white hover:bg-black/70"
          }`}
        >
          🔖
        </button>
      </div>
    </div>
  );
}
