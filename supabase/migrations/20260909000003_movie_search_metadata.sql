-- Keywords + production companies (real TMDB data) so a query like
-- "marvel" or "mcu" can match Avengers-style titles even though neither
-- word appears in the title itself — the actual fix for franchise/studio
-- search, rather than a hardcoded alias list. search_blob is a flattened,
-- lowercased "title + keyword names + company names" the app populates
-- (needs names resolved from TMDB, not just ids, so it's built in JS, not
-- SQL) and searches with a simple ILIKE/tsvector match.
alter table public.movies_cache
  add column if not exists keywords jsonb not null default '[]'::jsonb,
  add column if not exists production_companies jsonb not null default '[]'::jsonb,
  add column if not exists search_blob text not null default '';

create index if not exists movies_cache_search_blob_idx on public.movies_cache using gin (to_tsvector('simple', search_blob));
