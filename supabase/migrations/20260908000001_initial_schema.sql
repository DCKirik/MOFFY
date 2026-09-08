-- Moffy initial schema (spec §19). Written 2026-09-08.
-- NOT YET APPLIED to a live project — Supabase free-project limit blocked
-- provisioning (see FOUNDER_TODO.md). Apply via `apply_migration` once the
-- `moffy` project exists, then run 20260908000002_rls_policies.sql.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.movies_cache (
  tmdb_id integer primary key,
  title text not null,
  poster_path text,
  backdrop_path text,
  release_year integer,
  runtime integer,
  genres jsonb not null default '[]'::jsonb,
  director text,
  cast_members jsonb not null default '[]'::jsonb,
  overview text,
  external_rating numeric(3,1),
  popularity numeric,
  cached_at timestamptz not null default now()
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id integer not null references public.movies_cache(tmdb_id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id integer not null references public.movies_cache(tmdb_id) on delete cascade,
  watched_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.pathways (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  type text not null default 'main' check (type in ('main','themed')),
  filters_json jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.pathway_movies (
  pathway_id uuid not null references public.pathways(id) on delete cascade,
  movie_id integer not null references public.movies_cache(tmdb_id) on delete cascade,
  position integer not null,
  group_match_score numeric,
  primary key (pathway_id, movie_id)
);

create table public.pathway_progress (
  pathway_id uuid not null references public.pathways(id) on delete cascade,
  movie_id integer not null references public.movies_cache(tmdb_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','watched')),
  rating smallint check (rating between 1 and 5),
  completed_at timestamptz,
  primary key (pathway_id, movie_id, user_id)
);

create index ratings_user_id_idx on public.ratings (user_id);
create index ratings_movie_id_idx on public.ratings (movie_id);
create index watch_history_user_id_idx on public.watch_history (user_id);
create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);
create index group_members_user_id_idx on public.group_members (user_id);
create index pathways_group_id_idx on public.pathways (group_id);
create index pathway_progress_user_id_idx on public.pathway_progress (user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger ratings_set_updated_at before update on public.ratings
for each row execute function public.set_updated_at();
create trigger friendships_set_updated_at before update on public.friendships
for each row execute function public.set_updated_at();

-- Bootstraps a profiles row the moment someone signs up (spec §3).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- A group's creator is automatically its owner member (spec §10, §15).
create or replace function public.handle_new_group()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_group_created
after insert on public.groups
for each row execute function public.handle_new_group();

-- Rating a movie marks it watched, regardless of client path (spec §3).
create or replace function public.handle_rating_marks_watched()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.watch_history (user_id, movie_id)
  values (new.user_id, new.movie_id)
  on conflict (user_id, movie_id) do nothing;
  return new;
end;
$$;

create trigger ratings_mark_watched
after insert on public.ratings
for each row execute function public.handle_rating_marks_watched();
