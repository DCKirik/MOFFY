import { searchMovies } from "@/lib/tmdb/client";
import { MovieCard } from "@/components/movie/MovieCard";
import { Card } from "@/components/ui/Card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchMovies(query) : [];

  return (
    <div className="flex flex-col gap-6">
      <form className="flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search for a movie..."
          className="w-full rounded-xl2 border border-white/15 bg-brand-surface px-4 py-2.5 text-brand-ink outline-none focus:border-brand-orange"
        />
        <button
          type="submit"
          className="shrink-0 cursor-pointer rounded-xl2 bg-brand-yellow px-5 py-2.5 font-semibold text-brand-bg transition-colors hover:bg-brand-yellow-dark"
        >
          Search
        </button>
      </form>

      {!query && (
        <Card>
          <p className="text-brand-ink/60">Search for a title to get started.</p>
        </Card>
      )}

      {query && results.length === 0 && (
        <Card>
          <p className="text-brand-ink/60">No results for &ldquo;{query}&rdquo;.</p>
        </Card>
      )}

      {results.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {results.map((movie) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              posterPath={movie.poster_path}
              year={movie.release_date?.slice(0, 4)}
              externalRating={movie.vote_average}
            />
          ))}
        </div>
      )}
    </div>
  );
}
