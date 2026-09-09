-- Adds language metadata to movies_cache so the catalog can show a film's
-- original language and its known audio/spoken-language tracks. TMDB does
-- not expose per-platform subtitle availability (that's each streaming
-- service's own private catalog data, not public) — spoken_languages is
-- the closest real signal TMDB provides.
alter table public.movies_cache
  add column if not exists original_language text,
  add column if not exists spoken_languages jsonb not null default '[]'::jsonb;

create index if not exists movies_cache_original_language_idx on public.movies_cache (original_language);
