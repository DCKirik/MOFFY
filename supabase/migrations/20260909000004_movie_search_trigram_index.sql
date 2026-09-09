-- The GIN(to_tsvector(...)) index from 20260909000003 only accelerates
-- full-text `@@` queries — it does nothing for the app's actual query
-- shape, `search_blob ilike '%term%'` (needed for partial-word matches
-- while the user is still typing, e.g. autocomplete). A trigram index
-- is what actually speeds up ILIKE '%...%', so swap to that.
create extension if not exists pg_trgm;

drop index if exists movies_cache_search_blob_idx;

create index if not exists movies_cache_search_blob_trgm_idx on public.movies_cache using gin (search_blob gin_trgm_ops);
