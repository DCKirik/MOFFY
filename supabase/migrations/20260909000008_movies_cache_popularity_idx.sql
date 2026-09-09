-- getMoviePool / getMoviePoolPage / searchMoviePool / getReelCandidatePool all
-- `order by popularity desc` with no filter that could use another index
-- (genre_ids/search_blob) to narrow the scan first. Fine at ~32k rows;
-- started hitting statement_timeout at ~107k rows once the catalog
-- expansion finished, with zero index to fall back on.
create index if not exists movies_cache_popularity_idx on movies_cache (popularity desc);
