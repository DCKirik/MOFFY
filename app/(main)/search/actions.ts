"use server";

import { createClient } from "@/lib/supabase/server";
import { searchMoviePool } from "@/lib/tmdb/cache";
import type { GridMovie } from "@/components/movie/InfiniteMovieGrid";

export async function loadMoreSearchMovies(
  query: string,
  genreId: number | undefined,
  page: number,
): Promise<GridMovie[]> {
  const supabase = await createClient();
  const movies = await searchMoviePool(supabase, query, page, 40, genreId);
  return movies.map((m) => ({
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    year: m.release_date?.slice(0, 4),
    externalRating: m.vote_average,
  }));
}

export interface SearchSuggestion {
  id: number;
  title: string;
  year?: string;
  posterPath: string | null;
}

// Backs the typeahead dropdown — cheap enough (indexed ILIKE on the local
// cache, no TMDB round trip) to call on every keystroke.
export async function autocompleteMovies(query: string): Promise<SearchSuggestion[]> {
  const supabase = await createClient();
  const movies = await searchMoviePool(supabase, query, 1, 8);
  return movies.map((m) => ({
    id: m.id,
    title: m.title,
    year: m.release_date?.slice(0, 4),
    posterPath: m.poster_path,
  }));
}
