export interface TmdbMovieSummary {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  popularity: number;
  genre_ids: number[];
  original_language?: string;
}

export interface TmdbSpokenLanguage {
  iso_639_1: string;
  name: string;
  english_name: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCastMember {
  name: string;
  character: string;
  order: number;
}

export interface TmdbCrewMember {
  name: string;
  job: string;
}

export interface TmdbKeyword {
  id: number;
  name: string;
}

export interface TmdbProductionCompany {
  id: number;
  name: string;
}

export interface TmdbVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface TmdbWatchProviderRegion {
  link?: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  runtime: number | null;
  genres: TmdbGenre[];
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  credits: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };
  "watch/providers": {
    results: Record<string, TmdbWatchProviderRegion>;
  };
  original_language: string;
  spoken_languages: TmdbSpokenLanguage[];
  production_companies: TmdbProductionCompany[];
  keywords?: { keywords: TmdbKeyword[] };
  videos?: { results: TmdbVideo[] };
}
