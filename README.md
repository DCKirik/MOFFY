# Moffy

> What should I watch? What should we watch together? What should we watch next?

Moffy is a social movie discovery platform that learns each user's taste over time and recommends what to watch alone, with friends, or with family. Full product spec: [`docs/superpowers/specs/2026-09-08-moffy-mvp-design.md`](docs/superpowers/specs/2026-09-08-moffy-mvp-design.md).

**Not technical? Start with [`FOUNDER_TODO.md`](FOUNDER_TODO.md) instead of this file.**

Live: **https://moffy.vercel.app**

## Status: MVP feature-complete

Every feature in the spec's §21 "Build Now" list is live: auth, taste onboarding, TMDB-backed search/discover/movie detail, ratings + watch history, the deterministic personal recommendation engine (Moffy Match), a real Home page (carousel, Best Match, Recommended For You), friends, groups with owner/admin/member roles, the group recommendation engine with filters, and Main/Themed Pathways with per-member progress tracking.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 (brand tokens in `app/globals.css`)
- [Supabase](https://supabase.com) — Postgres, Auth, RLS
- [TMDB](https://www.themoviedb.org) — movie catalog, credits, watch providers
- [Vercel](https://vercel.com) — deployment, auto-deploys on push to `main`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
| --- | --- |
| `npm run dev` | local dev server |
| `npm run build` | production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | typecheck only |

## Environment variables

See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` is used server-side only (`lib/supabase/admin.ts`) to cache TMDB movie data — never exposed to the client. `ANTHROPIC_API_KEY` is unused so far (deferred per spec §20 — not needed for the core recommendation engine).

## Project structure

```
app/(auth)/                    login, signup, server actions
app/onboarding/                cold-start taste rating (5+ of 15 seed movies)
app/(main)/                    authenticated shell
  page.tsx                     Home — carousel, Best Match, Recommended For You
  discover/, search/           TMDB-backed browsing
  movie/[id]/                  movie detail — rating, community score, Moffy Match, streaming providers
  friends/                     search, request, accept/reject
  groups/[id]/                 members, roles
  groups/[id]/recommendations/ group recommendation engine + filters
  groups/[id]/pathways/        Main + Themed Pathways, generation, progress
  profile/                     stats, taste summary, rating history
lib/tmdb/                      server-only TMDB client, image helper, genre list, movies_cache upsert
lib/recommendations/           taste profile aggregation, personal + group Moffy Match scoring
lib/supabase/                  browser/server/admin Supabase clients
proxy.ts                       session refresh + auth/onboarding route guard
supabase/migrations/           SQL schema + RLS, applied by hand via SQL Editor (see FOUNDER_TODO.md)
docs/superpowers/               spec, implementation plan, progress log
```

## Known gaps / next up

- Streaming-platform filter on group recommendations/pathways is deferred (needs a per-candidate detail fetch that's too expensive for a ~20-movie pool on every filter change).
- "Max X members watched" filter simplified to a nobody-watched toggle.
- Post-MVP roadmap (trailers, notifications, watch themes, quizzes, discussion) intentionally not started — spec §22.
