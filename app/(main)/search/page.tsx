import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchMoviePool } from "@/lib/tmdb/cache";
import { TMDB_GENRES } from "@/lib/tmdb/genres";
import { Card } from "@/components/ui/Card";
import { InfiniteMovieGrid } from "@/components/movie/InfiniteMovieGrid";
import { SearchBar } from "@/components/movie/SearchBar";
import { loadMoreSearchMovies } from "./actions";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string }>;
}) {
  const { q, genre } = await searchParams;
  const query = q?.trim() ?? "";
  const genreId = genre ? Number(genre) : undefined;

  const supabase = await createClient();
  const results = query ? await searchMoviePool(supabase, query, 1, 40, genreId) : [];
  const initialMovies = results.map((m) => ({
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    year: m.release_date?.slice(0, 4),
    externalRating: m.vote_average,
  }));

  return (
    <div className="flex flex-col gap-6">
      <SearchBar initialQuery={query} />

      {query && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
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
              href={`/search?q=${encodeURIComponent(query)}&genre=${g.id}`}
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
      )}

      {!query && (
        <Card>
          <p className="text-brand-ink/60">Search for a title, studio, or keyword to get started.</p>
        </Card>
      )}

      {query && results.length === 0 && (
        <Card>
          <p className="text-brand-ink/60">No results for &ldquo;{query}&rdquo;.</p>
        </Card>
      )}

      {results.length > 0 && (
        <InfiniteMovieGrid
          key={`${query}-${genreId ?? "all"}`}
          initialMovies={initialMovies}
          loadMore={loadMoreSearchMovies.bind(null, query, genreId)}
        />
      )}
    </div>
  );
}
