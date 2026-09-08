-- Moffy Row Level Security (spec §23). Written 2026-09-08.
-- NOT YET APPLIED — depends on 20260908000001_initial_schema.sql existing
-- on a live project (see FOUNDER_TODO.md, Supabase free-project limit).

alter table public.profiles enable row level security;
alter table public.movies_cache enable row level security;
alter table public.ratings enable row level security;
alter table public.watch_history enable row level security;
alter table public.friendships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.pathways enable row level security;
alter table public.pathway_movies enable row level security;
alter table public.pathway_progress enable row level security;

-- SECURITY DEFINER so group-membership checks don't recurse into RLS
-- on group_members itself.
create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = p_group_id and user_id = p_user_id);
$$;

create or replace function public.group_role(p_group_id uuid, p_user_id uuid)
returns text language sql security definer stable set search_path = public as $$
  select role from public.group_members where group_id = p_group_id and user_id = p_user_id;
$$;

-- profiles: readable by any signed-in user (username search, group rosters);
-- writable only by its owner. No insert policy — rows are created only by
-- the handle_new_user trigger, so clients can never impersonate a signup.
create policy "profiles_select_all_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- movies_cache: shared read-only cache; only the server (service role,
-- bypassing RLS) writes to it when proxying TMDB.
create policy "movies_cache_select_all" on public.movies_cache for select to authenticated using (true);

-- ratings / watch_history: strictly private to their owner. Group
-- recommendation scoring reads these later via a SECURITY DEFINER RPC,
-- never direct cross-user table access.
create policy "ratings_select_own" on public.ratings for select to authenticated using (user_id = auth.uid());
create policy "ratings_insert_own" on public.ratings for insert to authenticated with check (user_id = auth.uid());
create policy "ratings_update_own" on public.ratings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ratings_delete_own" on public.ratings for delete to authenticated using (user_id = auth.uid());

create policy "watch_history_select_own" on public.watch_history for select to authenticated using (user_id = auth.uid());
create policy "watch_history_insert_own" on public.watch_history for insert to authenticated with check (user_id = auth.uid());
create policy "watch_history_delete_own" on public.watch_history for delete to authenticated using (user_id = auth.uid());

-- friendships: visible to either party; requester creates, either party
-- can update (accept/reject) or delete (cancel/remove).
create policy "friendships_select_own" on public.friendships for select to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "friendships_insert_own" on public.friendships for insert to authenticated with check (requester_id = auth.uid());
create policy "friendships_update_participant" on public.friendships for update to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid()) with check (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "friendships_delete_participant" on public.friendships for delete to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

-- groups: visible to members only; only the owner updates/deletes.
-- (owner's own group_members row is inserted by handle_new_group, not by
-- the insert policy below, so it exists before any select is attempted.)
create policy "groups_select_member" on public.groups for select to authenticated using (public.is_group_member(id, auth.uid()));
create policy "groups_insert_own" on public.groups for insert to authenticated with check (owner_id = auth.uid());
create policy "groups_update_owner" on public.groups for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "groups_delete_owner" on public.groups for delete to authenticated using (owner_id = auth.uid());

-- group_members: visible to members of that group; owner/admin add or
-- remove members; anyone can remove themselves (leave).
create policy "group_members_select_member" on public.group_members for select to authenticated using (public.is_group_member(group_id, auth.uid()));
create policy "group_members_insert_owner_admin" on public.group_members for insert to authenticated with check (public.group_role(group_id, auth.uid()) in ('owner','admin'));
create policy "group_members_update_owner" on public.group_members for update to authenticated using (public.group_role(group_id, auth.uid()) = 'owner') with check (public.group_role(group_id, auth.uid()) = 'owner');
create policy "group_members_delete_self_or_owner_admin" on public.group_members for delete to authenticated using (user_id = auth.uid() or public.group_role(group_id, auth.uid()) in ('owner','admin'));

-- pathways: visible to group members; only owner/admin write (spec §15:
-- "Ordinary members cannot create pathways").
create policy "pathways_select_member" on public.pathways for select to authenticated using (public.is_group_member(group_id, auth.uid()));
create policy "pathways_insert_owner_admin" on public.pathways for insert to authenticated with check (public.group_role(group_id, auth.uid()) in ('owner','admin'));
create policy "pathways_update_owner_admin" on public.pathways for update to authenticated using (public.group_role(group_id, auth.uid()) in ('owner','admin')) with check (public.group_role(group_id, auth.uid()) in ('owner','admin'));
create policy "pathways_delete_owner_admin" on public.pathways for delete to authenticated using (public.group_role(group_id, auth.uid()) in ('owner','admin'));

-- pathway_movies: membership/role checked via the parent pathway's group.
create policy "pathway_movies_select_member" on public.pathway_movies for select to authenticated using (
  exists (select 1 from public.pathways p where p.id = pathway_movies.pathway_id and public.is_group_member(p.group_id, auth.uid()))
);
create policy "pathway_movies_write_owner_admin" on public.pathway_movies for all to authenticated using (
  exists (select 1 from public.pathways p where p.id = pathway_movies.pathway_id and public.group_role(p.group_id, auth.uid()) in ('owner','admin'))
) with check (
  exists (select 1 from public.pathways p where p.id = pathway_movies.pathway_id and public.group_role(p.group_id, auth.uid()) in ('owner','admin'))
);

-- pathway_progress: every group member can see everyone's progress (so
-- avatars move on the shared path), but each user writes only their own row.
create policy "pathway_progress_select_member" on public.pathway_progress for select to authenticated using (
  exists (select 1 from public.pathways p where p.id = pathway_progress.pathway_id and public.is_group_member(p.group_id, auth.uid()))
);
create policy "pathway_progress_insert_own" on public.pathway_progress for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.pathways p where p.id = pathway_progress.pathway_id and public.is_group_member(p.group_id, auth.uid()))
);
create policy "pathway_progress_update_own" on public.pathway_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
