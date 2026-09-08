# Moffy MVP — Design

Source of truth: `Moffy_MVP_Product_Technical_Specification_v0.1.docx` (founder-authored, provided 2026-09-08). This file records the technical decisions made to implement that spec; it does not restate product rationale already covered there.

## Scope decomposition

The spec covers many independent subsystems (auth, taste engine, movie catalog, friends, groups, pathways, recommendation engines). Per the founder's request tonight ("set up the infrastructure"), this design + its plan cover **Sub-project 1: Infrastructure & Foundation** only:

- Next.js project scaffold
- Design system / brand tokens
- Supabase project + full DB schema + RLS
- Auth (sign up / log in / log out, profile bootstrap)
- App shell + navigation (desktop + mobile)
- Env var wiring, README, deploy pipeline

Each remaining subsystem (taste onboarding, TMDB catalog + search, personal recommendation engine, friends, groups, group recommendation engine, pathways, pathway progress) is its own follow-up sub-project, built incrementally per spec §24 ("do not build the entire product in one uncontrolled pass"). This design doc will be extended (or new dated ones added) as each is tackled.

## Architecture

- **Framework:** Next.js (App Router) + TypeScript, deployed on Vercel (spec §18).
- **Styling:** Tailwind CSS, with brand tokens (warm yellow primary `#F5B722`, orange accent `#F2782F`, warm off-white background `#FFFBF2`) per spec §16.
- **Backend:** Supabase — Postgres + Auth + Storage. New project `moffy` created under the founder's existing Supabase org. No custom backend server; Next.js Route Handlers proxy TMDB (keeps the TMDB key server-side) and will later host recommendation-scoring RPCs.
- **Data access:** `@supabase/ssr` for cookie-based auth across Server Components, Route Handlers, and a `middleware.ts` session refresher. Browser client for client components, server client for RSC/route handlers — never the service-role key in browser code.
- **Auth:** Supabase email/password only for MVP (spec doesn't call for social login). A Postgres trigger on `auth.users` inserts the matching `profiles` row automatically — the app never has to remember to do it.

## Data model

Tables match spec §19 exactly: `profiles`, `movies_cache`, `ratings`, `watch_history`, `friendships`, `groups`, `group_members`, `pathways`, `pathway_movies`, `pathway_progress`.

Notable decisions beyond the spec's field list:
- `movies_cache` is populated lazily from TMDB responses (spec §5: "do not manually maintain the catalog") — it's a cache, not authored data, keyed on `tmdb_id`.
- Rating → watched linkage (spec §3: "Rating a movie may automatically mark it as watched") is enforced with a DB trigger on `ratings` insert/update that upserts `watch_history`, so it holds regardless of which client path writes the rating.
- Group-role checks needed by RLS on `pathways`/`pathway_movies`/`pathway_progress` use two `SECURITY DEFINER` helper functions (`is_group_member`, `group_role`) to avoid RLS self-recursion on `group_members`.

## RLS policy shape (spec §23)

- `profiles`: readable by any authenticated user (needed for username search / friend discovery / group rosters); writable only by the row's owner.
- `ratings`, `watch_history`: strictly private to `user_id = auth.uid()`. Group recommendation scoring reads these later via a `SECURITY DEFINER` RPC, not direct cross-user table access — so a group member's raw ratings are never exposed to other members through the API.
- `friendships`: visible to either party; the addressee accepts/rejects, the requester can cancel a pending request.
- `groups`: visible to members only; only the owner can update/delete.
- `group_members`: visible to members of that group; owner/admin can add or remove members; a user can always remove themselves.
- `pathways`, `pathway_movies`: visible to group members; write access limited to owner/admin (spec §15: "Ordinary members cannot create pathways").
- `pathway_progress`: visible to group members (so everyone's avatar position is visible on the shared path); a user can only write their own progress row.

## Navigation (spec §17)

Desktop top nav: `MOFFY | Home | Discover | Groups | Pathways | Friends | Search | Profile`.
Mobile bottom nav: `Home | Discover | Groups | Search | Profile`.
Both live in one `<AppShell>` component reading viewport via Tailwind breakpoints — no separate mobile/desktop route trees.

## Explicitly deferred (not in tonight's scope)

Everything under spec §22, plus every MVP feature listed in §21 beyond the shell itself (taste onboarding UI, TMDB search/detail, rating UI, recommendation math, friends UI, group UI, pathway UI). The infrastructure this design builds is what those features will be implemented on top of.
