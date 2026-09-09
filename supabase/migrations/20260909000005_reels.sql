-- Trailer key on every cached movie (populated by scripts/seed-movies.mjs
-- and cacheMovie going forward) plus a like/dislike table for a
-- TikTok/Reels-style trailer feed — swipes are a lighter-weight, higher-
-- volume signal than a star rating, feeding computeTasteProfile at a
-- lower weight than actual ratings (see lib/recommendations/taste-profile.ts).
alter table public.movies_cache
  add column if not exists trailer_key text;

create table if not exists public.reel_swipes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id integer not null references public.movies_cache(tmdb_id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create index if not exists reel_swipes_user_id_idx on public.reel_swipes (user_id);

alter table public.reel_swipes enable row level security;

create policy "reel_swipes_select_own" on public.reel_swipes for select to authenticated using (user_id = auth.uid());
create policy "reel_swipes_insert_own" on public.reel_swipes for insert to authenticated with check (user_id = auth.uid());
create policy "reel_swipes_update_own" on public.reel_swipes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reel_swipes_delete_own" on public.reel_swipes for delete to authenticated using (user_id = auth.uid());
