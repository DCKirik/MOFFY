create table if not exists movie_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id integer not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table movie_comments enable row level security;

create policy movie_comments_select_all on movie_comments
  for select using (true);

create policy movie_comments_insert_own on movie_comments
  for insert with check (user_id = auth.uid());

create policy movie_comments_delete_own on movie_comments
  for delete using (user_id = auth.uid());

create index if not exists movie_comments_movie_id_idx on movie_comments (movie_id, created_at desc);
