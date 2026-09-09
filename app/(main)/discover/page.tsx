import { getPopularMovies } from "@/lib/tmdb/client";
import { MovieCard } from "@/components/movie/MovieCard";

export default async function DiscoverPage() {
  const movies = await getPopularMovies();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-brand-ink">Discover</h1>
        <p className="text-brand-ink/60">Popular movies right now.</p>
      </div>
      <div className="flex flex-wrap gap-4">
        {movies.map((movie) => (
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
    </div>
  );
}
