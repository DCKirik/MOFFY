import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMoviePoolPage } from "@/lib/tmdb/cache";
import { TMDB_GENRES } from "@/lib/tmdb/genres";
import { InfiniteMovieGrid } from "@/components/movie/InfiniteMovieGrid";
import { loadMoreDiscoverMovies } from "./actions";

// No auth/cookie read here originally, so Next treated this as eligible
// for build-time static generation — one transient TMDB hiccup during a
// Vercel build then failed the entire deploy (see commit 9b3962f). Forcing
// dynamic moves data fetching to request time, like every other page.
export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre } = await searchParams;
  const genreId = genre ? Number(genre) : undefined;

  const supabase = await createClient();
  const movies = await getMoviePoolPage(supabase, 1, 40, genreId);
  const initialMovies = movies.map((m) => ({
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    year: m.release_date?.slice(0, 4),
    externalRating: m.vote_average,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-brand-ink">Discover</h1>
        <p className="text-brand-ink/60">Browse the full Moffy catalog.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/discover"
          className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            !genreId
              ? "border-brand-orange bg-brand-orange text-white"
              : "border-white/15 bg-brand-surface-2 text-brand-ink/80 hover:border-brand-orange/40"
          }`}
        >
          All
        </Link>
        {TMDB_GENRES.map((g) => (
          <Link
            key={g.id}
            href={`/discover?genre=${g.id}`}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              genreId === g.id
                ? "border-brand-orange bg-brand-orange text-white"
                : "border-white/15 bg-brand-surface-2 text-brand-ink/80 hover:border-brand-orange/40"
            }`}
          >
            {g.name}
          </Link>
        ))}
      </div>

      <InfiniteMovieGrid
        key={genreId ?? "all"}
        initialMovies={initialMovies}
        loadMore={loadMoreDiscoverMovies.bind(null, genreId)}
      />
    </div>
  );
}
