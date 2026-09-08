-- Aggregate rating for movie detail pages (spec §5: "Moffy community
-- rating, rating count"). SECURITY DEFINER so it can read across all
-- users' ratings while only ever exposing an aggregate, never a raw row —
-- the ratings table itself stays strictly private per-user (spec §23).
create or replace function public.movie_community_rating(p_movie_id integer)
returns table(avg_rating numeric, rating_count bigint)
language sql security definer stable set search_path = public as $$
  select avg(rating)::numeric(3,2), count(*)::bigint
  from public.ratings
  where movie_id = p_movie_id;
$$;

grant execute on function public.movie_community_rating(integer) to authenticated;
