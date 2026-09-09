create table if not exists saved_movies (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

alter table saved_movies enable row level security;

create policy saved_movies_select_own on saved_movies
  for select using (user_id = auth.uid());

create policy saved_movies_insert_own on saved_movies
  for insert with check (user_id = auth.uid());

create policy saved_movies_update_own on saved_movies
  for update using (user_id = auth.uid());

create policy saved_movies_delete_own on saved_movies
  for delete using (user_id = auth.uid());

create index if not exists saved_movies_user_id_idx on saved_movies (user_id);
