-- movies_cache SELECT was "to authenticated" only, so the new public
-- /welcome splash page (no login yet) got an empty poster collage —
-- RLS denial returns an empty result, not an error, so this was silent.
-- Safe to widen: movies_cache holds no private data, just the same
-- public movie metadata TMDB itself serves to anyone.
drop policy "movies_cache_select_all" on public.movies_cache;
create policy "movies_cache_select_all" on public.movies_cache for select to authenticated, anon using (true);
