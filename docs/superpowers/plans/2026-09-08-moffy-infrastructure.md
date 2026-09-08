# Moffy Infrastructure & Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js/Supabase foundation Moffy's features get built on: scaffold, brand design system, full DB schema with RLS, working auth, and a clickable navigation shell — deployed and building green on Vercel.

**Architecture:** Next.js (App Router, TypeScript) on Vercel; Supabase (Postgres + Auth) as the only backend, accessed via `@supabase/ssr` browser/server clients and a session-refresh middleware; Tailwind for styling with brand tokens from spec §16. No custom server, no ORM — Supabase client + SQL migrations.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, @supabase/supabase-js, @supabase/ssr, Supabase Postgres/Auth, Vercel.

## Progress (2026-09-08 evening session)

- **Task 1 (scaffold):** done — `ffc8d98`.
- **Task 2 (brand tokens + UI primitives):** done — `dcfd145`.
- **Task 3 (Supabase clients + proxy):** code done — `13c862f`. **Provisioning blocked:** founder's Supabase account is at its 2-project free-tier cap; the only other project (`stem & buds`) is paused and `restore_project` hits the same cap, so it can't even be read to back up before deletion, and this MCP server exposes no `delete_project` tool. Handed to the founder — see `FOUNDER_TODO.md` §1. `.env.local`/`.env.example` currently hold placeholder values so the app builds and runs (auth calls fail gracefully → redirect to `/login`, verified locally).
- **Task 4 (DB schema) + Task 5 (RLS):** SQL written and committed (`607dbea`) but **not applied** — same Supabase blocker. Apply both migration files via `apply_migration` the moment a project exists.
- **Task 6 (auth) + Task 7 (nav shell):** code done, builds clean, route guard verified (curl + browser, desktop + mobile) — `7351cb7`. Full logged-in click-through and the "profile row created on signup" check are deferred to when Supabase is real.
- **Task 8 (docs):** README + FOUNDER_TODO written. Vercel linking deferred on purpose — linking now would ship a deployment that 500s on every request (no valid Supabase URL to construct a client with), and there's no MCP tool to set Vercel env vars, so it wouldn't be fixable without founder action anyway. Do it once Supabase is real and TMDB key is in hand, in one pass.
- **TMDB key:** not yet provided — needed for Discover/Search/Movie-detail sub-projects, not for anything in this plan.

## Update — overnight session, 2026-09-08 → 09

All blockers above resolved (real Supabase project, TMDB key, GitHub push, Vercel deploy — see FOUNDER_TODO.md history and commits `dfc04ee`/`1d4238b`). Founder then asked for full autonomy overnight to build as much of the remaining MVP as possible. Every sub-project this plan deferred (see "Next sub-projects" below) got built, verified live with two real test accounts, and shipped:

- TMDB integration + search/discover/movie detail/rating — `8ed3f9c`
- Taste onboarding — `03a5437`
- Personal recommendation engine + real Home page — `fd74202`
- Friends — `bbabbea`
- Groups (roles, members) — `8299740` (root-caused a real Postgres RLS+trigger+RETURNING bug along the way, documented in that commit)
- Group recommendation engine + filters — `a3de857`
- Pathways (Main + Themed, generation, progress) — `37bd56c`
- Profile page — see latest commit on `main`

Spec §21's full "MVP Scope — Build Now" list is done. See `README.md` "Known gaps" for the small, deliberate simplifications (streaming-platform filter, watched-count filter granularity) and spec §22 for what's intentionally still not started.

## Global Constraints

*(carried verbatim from `Moffy_MVP_Product_Technical_Specification_v0.1.docx`; every task below implicitly includes these)*

- All API credentials (TMDB, Anthropic, Supabase secrets) are server-side environment variables only, never committed. (spec §6, §20, §23)
- Never expose TMDB tokens, Anthropic API keys, or Supabase secret/service keys in client code. (§23)
- Secrets live in `.env.local`; only `.env.example` (placeholders) is committed. (§23)
- Row Level Security is applied to all user-specific and group-specific tables. (§23)
- Role/permission checks (owner/admin/member) are enforced DB-side, not just by hiding UI. (§15, §23)
- Recommendation engine is not LLM-dependent in the MVP (future phase, recorded here so it isn't violated later). (§8)
- Any Anthropic usage is server-side only, sparing, never `NEXT_PUBLIC_ANTHROPIC_API_KEY`. (§20, future phase)
- Brand: bright + colorful + minimal + premium; warm yellow primary + orange accent; warm off-white background; avoid the dark/black movie-app cliché; mobile-first but polished on desktop. (§16)
- Verify loop per task: implement → typecheck → lint → build → manual/DB verify → commit. Never move to the next task while the current one is broken. (§24)

**Adaptation note:** this is a Next.js/TS + SQL project, not a unit-test-first codebase yet — there's no business logic in this phase to unit test. "Test" in the verify loop below means `tsc --noEmit` + `next lint` + `next build`, plus a real SQL check for anything migrated into Postgres (RLS/triggers are verified with actual `execute_sql` calls, not mocked). Real automated tests start with the recommendation-engine sub-project, where there's pure logic worth pinning down.

---

## File Structure

```
app/
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (auth)/actions.ts
  (main)/layout.tsx            # authenticated shell: nav + session guard
  (main)/page.tsx              # Home (placeholder content)
  (main)/discover/page.tsx
  (main)/groups/page.tsx
  (main)/pathways/page.tsx
  (main)/friends/page.tsx
  (main)/search/page.tsx
  (main)/profile/page.tsx
  layout.tsx                   # root layout
  globals.css
components/
  ui/Button.tsx, Card.tsx, StarRating.tsx, MatchBadge.tsx, Avatar.tsx
  nav/TopNav.tsx, BottomNav.tsx
lib/
  supabase/client.ts            # browser client
  supabase/server.ts            # server client (RSC + route handlers)
  types/database.types.ts       # generated from live schema
  utils/cn.ts
middleware.ts                   # Supabase session refresh + route guard
supabase/migrations/*.sql       # source-controlled copies of applied migrations
.env.example
README.md
```

---

### Task 1: Project scaffold

**Files:**
- Create: entire Next.js scaffold (`package.json`, `tsconfig.json`, `next.config.ts`, `app/`, `public/`, `.gitignore`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`)
- Modify: remove placeholder `README.md` (rewritten in Task 8)

**Interfaces:**
- Produces: a buildable Next.js App Router project at repo root that every later task adds files into.

- [x] **Step 1: Scaffold**

```bash
rm README.md
npx --yes create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --no-turbopack
```

If the installed `create-next-app` version rejects a flag or the non-empty directory (`.git` present), re-run with the equivalent current flags — the goal is: TS + Tailwind + ESLint + App Router, npm, root-level `app/`, no `src/`.

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three exit 0 on the generated starter page.

- [x] **Step 3: Commit**

Landed as `ffc8d98` (Tailwind v4 — no `tailwind.config.ts`, tokens live in `app/globals.css` via `@theme`; Task 2 updated accordingly).

---

### Task 2: Brand tokens & base UI primitives

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Create: `lib/utils/cn.ts`
- Create: `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/StarRating.tsx`, `components/ui/MatchBadge.tsx`, `components/ui/Avatar.tsx`

**Interfaces:**
- Produces: `cn(...classes)` helper; `<Button variant="primary"|"secondary"|"ghost">`, `<Card>`, `<StarRating value rating? onRate?>`, `<MatchBadge percent>`, `<Avatar url? name>` — every later UI task imports these instead of hand-rolling styles.

- [ ] **Step 1: Install class helpers**

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 2: `lib/utils/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Brand tokens in `tailwind.config.ts`**

Extend `theme.extend`:

```ts
colors: {
  brand: {
    yellow: "#F5B722",
    "yellow-dark": "#D89A0F",
    orange: "#F2782F",
    bg: "#FFFBF2",
    ink: "#241C10",
  },
},
borderRadius: {
  xl2: "1.25rem",
},
```

- [ ] **Step 4: `app/globals.css`**

Set `body { @apply bg-brand-bg text-brand-ink; }` under the existing Tailwind directives (keep the rest of the generated file as-is).

- [ ] **Step 5: `components/ui/Button.tsx`**

```tsx
import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl2 px-5 py-2.5 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "bg-brand-yellow text-brand-ink hover:bg-brand-yellow-dark",
        variant === "secondary" && "bg-brand-orange text-white hover:opacity-90",
        variant === "ghost" && "bg-transparent text-brand-ink hover:bg-black/5",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 6: `components/ui/Card.tsx`**

```tsx
import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl2 bg-white shadow-sm border border-black/5 p-4",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 7: `components/ui/StarRating.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils/cn";

export function StarRating({
  rating,
  onRate,
}: {
  rating: number;
  onRate?: (value: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating >= star}
          disabled={!onRate}
          onClick={() => onRate?.(star)}
          className={cn(
            "text-2xl leading-none",
            rating >= star ? "text-brand-orange" : "text-black/15",
            onRate && "cursor-pointer",
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: `components/ui/MatchBadge.tsx`**

```tsx
export function MatchBadge({ percent }: { percent: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-yellow px-3 py-1 text-sm font-bold text-brand-ink">
      {Math.round(percent)}% Match
    </span>
  );
}
```

- [ ] **Step 9: `components/ui/Avatar.tsx`**

```tsx
import Image from "next/image";

export function Avatar({ url, name, size = 40 }: { url?: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-brand-orange font-semibold text-white"
    >
      {initials}
    </div>
  );
}
```

- [ ] **Step 10: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: brand design tokens and base UI primitives"
```

---

### Task 3: Supabase project + client helpers

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Create: `middleware.ts`
- Create: `.env.local` (gitignored — real values), `.env.example` (placeholders)

**Interfaces:**
- Consumes: nothing yet (schema comes in Task 4/5).
- Produces: `createClient()` (browser, from `lib/supabase/client.ts`) and `createClient()` (server/async, from `lib/supabase/server.ts`) — every later data-access task uses one of these two, never a hand-rolled Supabase client.

- [ ] **Step 1: Provision the Supabase project (MCP, not code)**

Create project `moffy` in the founder's existing org via the Supabase MCP `create_project` tool (region `eu-central-1`), then fetch its URL and anon/publishable key via `get_project_url` / `get_publishable_keys`. Get the service-role key from the Supabase dashboard's API settings page (MCP does not expose secret keys).

- [ ] **Step 2: Install packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TMDB_API_KEY=
ANTHROPIC_API_KEY=
```

`.env.local` gets the same keys with real values and is confirmed present in `.gitignore` (the Next.js starter already ignores `.env*.local`).

- [ ] **Step 4: `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 5: `lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component; middleware refreshes the session instead
          }
        },
      },
    },
  );
}
```

- [ ] **Step 6: `proxy.ts`** (Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` / `export function proxy` — same API, new name; file below written under that name)

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/", "/discover", "/groups", "/pathways", "/friends", "/search", "/profile"];
const AUTH_PAGES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && PROTECTED.includes(path)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && AUTH_PAGES.includes(path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

Note: a placeholder `lib/types/database.types.ts` (exporting `type Database = any`) is needed for this task's imports to typecheck — Task 5's last step overwrites it with the generated schema types.

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

- [ ] **Step 8: Commit** (`.env.local` must NOT be staged)

```bash
git add lib/supabase middleware.ts .env.example lib/types/database.types.ts package.json package-lock.json
git status   # confirm .env.local is not listed
git commit -m "feat: Supabase project + client/middleware wiring"
```

---

### Task 4: Database schema migration

**Files:**
- Create: `supabase/migrations/20260908000001_initial_schema.sql`

**Interfaces:**
- Produces: tables `profiles, movies_cache, ratings, watch_history, friendships, groups, group_members, pathways, pathway_movies, pathway_progress`, plus triggers `handle_new_user` (auth.users → profiles), `handle_new_group` (groups → owner group_members row), `handle_rating_marks_watched` (ratings → watch_history), `set_updated_at`.

- [ ] **Step 1: Write the migration file**

```sql
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
```

- [ ] **Step 2: Apply via Supabase MCP**

Call `apply_migration` with `name: "initial_schema"` and the SQL above against the `moffy` project.

- [ ] **Step 3: Verify**

`list_tables` on the project → all 10 tables present. `execute_sql`: insert a throwaway `auth.users`-less check isn't possible directly, so verify instead by signing up a real test user in Task 6 and confirming the `profiles` row appears (deferred verification, noted here so it isn't forgotten).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260908000001_initial_schema.sql
git commit -m "feat: initial Supabase schema (10 tables, bootstrap triggers)"
```

---

### Task 5: RLS policies + generated types

**Files:**
- Create: `supabase/migrations/20260908000002_rls_policies.sql`
- Modify: `lib/types/database.types.ts` (overwrite placeholder with generated types)

**Interfaces:**
- Consumes: tables from Task 4.
- Produces: `is_group_member(uuid, uuid) → boolean`, `group_role(uuid, uuid) → text` — later group/pathway features query through these instead of re-deriving membership.

- [ ] **Step 1: Write the migration file**

```sql
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

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = p_group_id and user_id = p_user_id);
$$;

create or replace function public.group_role(p_group_id uuid, p_user_id uuid)
returns text language sql security definer stable set search_path = public as $$
  select role from public.group_members where group_id = p_group_id and user_id = p_user_id;
$$;

create policy "profiles_select_all_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "movies_cache_select_all" on public.movies_cache for select to authenticated using (true);

create policy "ratings_select_own" on public.ratings for select to authenticated using (user_id = auth.uid());
create policy "ratings_insert_own" on public.ratings for insert to authenticated with check (user_id = auth.uid());
create policy "ratings_update_own" on public.ratings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ratings_delete_own" on public.ratings for delete to authenticated using (user_id = auth.uid());

create policy "watch_history_select_own" on public.watch_history for select to authenticated using (user_id = auth.uid());
create policy "watch_history_insert_own" on public.watch_history for insert to authenticated with check (user_id = auth.uid());
create policy "watch_history_delete_own" on public.watch_history for delete to authenticated using (user_id = auth.uid());

create policy "friendships_select_own" on public.friendships for select to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "friendships_insert_own" on public.friendships for insert to authenticated with check (requester_id = auth.uid());
create policy "friendships_update_participant" on public.friendships for update to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid()) with check (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "friendships_delete_participant" on public.friendships for delete to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "groups_select_member" on public.groups for select to authenticated using (public.is_group_member(id, auth.uid()));
create policy "groups_insert_own" on public.groups for insert to authenticated with check (owner_id = auth.uid());
create policy "groups_update_owner" on public.groups for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "groups_delete_owner" on public.groups for delete to authenticated using (owner_id = auth.uid());

create policy "group_members_select_member" on public.group_members for select to authenticated using (public.is_group_member(group_id, auth.uid()));
create policy "group_members_insert_owner_admin" on public.group_members for insert to authenticated with check (public.group_role(group_id, auth.uid()) in ('owner','admin'));
create policy "group_members_update_owner" on public.group_members for update to authenticated using (public.group_role(group_id, auth.uid()) = 'owner') with check (public.group_role(group_id, auth.uid()) = 'owner');
create policy "group_members_delete_self_or_owner_admin" on public.group_members for delete to authenticated using (user_id = auth.uid() or public.group_role(group_id, auth.uid()) in ('owner','admin'));

create policy "pathways_select_member" on public.pathways for select to authenticated using (public.is_group_member(group_id, auth.uid()));
create policy "pathways_insert_owner_admin" on public.pathways for insert to authenticated with check (public.group_role(group_id, auth.uid()) in ('owner','admin'));
create policy "pathways_update_owner_admin" on public.pathways for update to authenticated using (public.group_role(group_id, auth.uid()) in ('owner','admin')) with check (public.group_role(group_id, auth.uid()) in ('owner','admin'));
create policy "pathways_delete_owner_admin" on public.pathways for delete to authenticated using (public.group_role(group_id, auth.uid()) in ('owner','admin'));

create policy "pathway_movies_select_member" on public.pathway_movies for select to authenticated using (exists (select 1 from public.pathways p where p.id = pathway_movies.pathway_id and public.is_group_member(p.group_id, auth.uid())));
create policy "pathway_movies_write_owner_admin" on public.pathway_movies for all to authenticated using (exists (select 1 from public.pathways p where p.id = pathway_movies.pathway_id and public.group_role(p.group_id, auth.uid()) in ('owner','admin'))) with check (exists (select 1 from public.pathways p where p.id = pathway_movies.pathway_id and public.group_role(p.group_id, auth.uid()) in ('owner','admin')));

create policy "pathway_progress_select_member" on public.pathway_progress for select to authenticated using (exists (select 1 from public.pathways p where p.id = pathway_progress.pathway_id and public.is_group_member(p.group_id, auth.uid())));
create policy "pathway_progress_insert_own" on public.pathway_progress for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.pathways p where p.id = pathway_progress.pathway_id and public.is_group_member(p.group_id, auth.uid())));
create policy "pathway_progress_update_own" on public.pathway_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
```

- [ ] **Step 2: Apply via Supabase MCP**

`apply_migration` with `name: "rls_policies"`.

- [ ] **Step 3: Verify**

Call `get_advisors(type: "security")` on the project → confirm no "RLS disabled" or "function search_path mutable" warnings for the tables/functions above.

- [ ] **Step 4: Generate types**

Call `generate_typescript_types`, write the result to `lib/types/database.types.ts`, replacing the Task 3 placeholder.

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260908000002_rls_policies.sql lib/types/database.types.ts
git commit -m "feat: RLS policies for all tables + generated DB types"
```

---

### Task 6: Auth (sign up / log in / log out)

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/actions.ts`
- Modify: `app/layout.tsx` (root layout, minimal — fonts/metadata only)

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/server.ts`.
- Produces: server actions `signUp(formData)`, `signIn(formData)`, `signOut()` — the Task 7 nav's logout button calls `signOut`.

- [ ] **Step 1: `app/(auth)/actions.ts`**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: `app/(auth)/login/page.tsx`** and **`signup/page.tsx`**

Minimal branded forms (email + password inputs, `<Button>` from Task 2, error message read from `searchParams.error`), posting to the matching server action. Same structure for both pages, differing only in which action they call and a link to the other page.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

With the dev server running, use the Browser tool to sign up a test account, then confirm via `execute_sql` (`select id, username from public.profiles order by created_at desc limit 1;`) that the bootstrap trigger created the profile row.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: email/password auth (signup, login, logout)"
```

---

### Task 7: App shell & navigation

**Files:**
- Create: `components/nav/TopNav.tsx`, `components/nav/BottomNav.tsx`
- Create: `app/(main)/layout.tsx`
- Create: `app/(main)/page.tsx`, `discover/page.tsx`, `groups/page.tsx`, `pathways/page.tsx`, `friends/page.tsx`, `search/page.tsx`, `profile/page.tsx`

**Interfaces:**
- Consumes: `TopNav`/`BottomNav` render nav items per spec §17; `signOut` action from Task 6.
- Produces: every route in spec §17 exists and renders (placeholder body), so later feature tasks fill in one page at a time without touching routing/nav again.

- [ ] **Step 1: `components/nav/TopNav.tsx`** (desktop, `hidden md:flex`)

Links: `MOFFY | Home | Discover | Groups | Pathways | Friends | Search | Profile`, active link underlined in `brand-orange`, a logout button calling `signOut`.

- [ ] **Step 2: `components/nav/BottomNav.tsx`** (mobile, `flex md:hidden`, fixed to viewport bottom)

Links: `Home | Discover | Groups | Search | Profile`.

- [ ] **Step 3: `app/(main)/layout.tsx`**

Renders `<TopNav />`, `{children}`, `<BottomNav />`.

- [ ] **Step 4: Placeholder pages**

Each page: a `<Card>` with the section title and "Coming soon" — real content arrives in that feature's own sub-project plan.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Browser tool: log in, click every nav link at desktop width, then `resize_window` to mobile and click every bottom-nav link — confirm no 404s or console errors, confirm logged-out visits to `/` redirect to `/login` (middleware from Task 3).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: navigation shell and placeholder feature routes"
```

---

### Task 8: Docs, deploy, final verification

**Files:**
- Modify: `README.md`
- Create: `FOUNDER_TODO.md`

**Interfaces:**
- Produces: a project a new contributor (or the founder, non-technically) can orient in without asking Claude first.

- [ ] **Step 1: `README.md`**

Project description (from spec §1), tech stack, `npm install` / `npm run dev` / `npm run build` / `npm run lint`, required env vars (pointing at `.env.example`), and a link to `FOUNDER_TODO.md`.

- [ ] **Step 2: `FOUNDER_TODO.md`**

The founder-facing task list (see Task 8 execution notes — content mirrors whatever's still outstanding when this task runs, e.g. TMDB key).

- [ ] **Step 3: Link Vercel**

Use the Vercel MCP `create_git_project` tool (`repo: "DCKirik/MOFFY"`, `teamId` from `Proxola`) to connect the GitHub repo for auto-deploy on push to `main`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` as Vercel project env vars (via MCP if a tool supports it; otherwise document the exact dashboard steps in `FOUNDER_TODO.md`).

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Confirm the Vercel deployment triggered by the push in Step 5 succeeds (`get_deployment` / `get_deployment_build_logs` if it fails).

- [ ] **Step 5: Commit + push**

```bash
git add README.md FOUNDER_TODO.md
git commit -m "docs: README and founder task list"
git push origin main
```

---

## Next sub-projects (separate spec + plan each, not tonight)

Taste onboarding · TMDB search & movie detail · personal recommendation engine (Moffy Match) · friends · groups · group recommendation engine + filters · pathways + themed pathways + progress tracking. Each follows the same brainstorming → plan → implement cycle, building on this foundation.
