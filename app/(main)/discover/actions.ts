"use server";

import { createClient } from "@/lib/supabase/server";
import { getMoviePoolPage } from "@/lib/tmdb/cache";
import type { GridMovie } from "@/components/movie/InfiniteMovieGrid";

export async function loadMoreDiscoverMovies(genreId: number | undefined, page: number): Promise<GridMovie[]> {
  const supabase = await createClient();
  const movies = await getMoviePoolPage(supabase, page, 40, genreId);
  return movies.map((m) => ({
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    year: m.release_date?.slice(0, 4),
    externalRating: m.vote_average,
  }));
}
