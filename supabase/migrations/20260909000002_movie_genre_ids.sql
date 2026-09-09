-- Plain integer[] mirror of the genre ids already in movies_cache.genres
-- (jsonb array of {id,name}). PostgREST's jsonb "contains" operator on an
-- array-of-objects column doesn't accept the query shape the JS client
-- sends for it (22P02 invalid json input) — a real integer[] column with
-- a GIN index and the standard overlap operator is the reliable way to
-- filter by genre.
alter table public.movies_cache
  add column if not exists genre_ids integer[] not null default '{}';

update public.movies_cache
set genre_ids = (
  select coalesce(array_agg((g->>'id')::integer), '{}')
  from jsonb_array_elements(genres) as g
)
where genre_ids = '{}';

create index if not exists movies_cache_genre_ids_idx on public.movies_cache using gin (genre_ids);
