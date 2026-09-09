-- New "browse by language, best to worst" feature filters on
-- original_language and sorts by external_rating. original_language
-- already has its own index but filter+sort across two separate indexes
-- still cost a full sort step at 236k+ rows — confirmed live with an
-- 8.8s statement-timeout on a cold query. A composite index lets Postgres
-- satisfy both the filter and the sort from one index scan.
create index if not exists movies_cache_lang_rating_idx on movies_cache (original_language, external_rating desc);
