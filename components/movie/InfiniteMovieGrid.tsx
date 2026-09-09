"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MovieCard } from "@/components/movie/MovieCard";

export interface GridMovie {
  id: number;
  title: string;
  posterPath: string | null;
  year?: string | number | null;
  externalRating?: number | null;
  matchPercent?: number | null;
}

// Shared by Discover (paging through the cached catalog) and Search
// (paging through TMDB's own search results) — both just need "here's
// page N, give me page N+1" from a bound server action.
//
// Callers must pass a `key` that changes with the query/filter (e.g.
// `${query}-${genreId}`) so React remounts this with fresh state instead
// of reusing it — internal page/hasMore state can't safely "sync" to a
// changed initialMovies prop via an effect (cascading-render footgun).
export function InfiniteMovieGrid({
  initialMovies,
  loadMore,
}: {
  initialMovies: GridMovie[];
  loadMore: (page: number) => Promise<GridMovie[]>;
}) {
  const [movies, setMovies] = useState(initialMovies);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialMovies.length > 0);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || loadingRef.current) return;
        loadingRef.current = true;
        const nextPage = page + 1;
        startTransition(() => {
          loadMore(nextPage)
            .then((next) => {
              if (next.length === 0) {
                setHasMore(false);
              } else {
                setMovies((prev) => [...prev, ...next]);
                setPage(nextPage);
              }
            })
            .catch((err) => {
              console.error("Failed to load more movies", err);
              setHasMore(false);
            })
            .finally(() => {
              loadingRef.current = false;
            });
        });
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loadMore]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            posterPath={movie.posterPath}
            year={movie.year}
            externalRating={movie.externalRating}
            matchPercent={movie.matchPercent}
          />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isPending && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-ink/20 border-t-brand-orange" />
          )}
        </div>
      )}
    </div>
  );
}
