# Moffy

> What should I watch? What should we watch together? What should we watch next?

Moffy is a social movie discovery platform that learns each user's taste over time and recommends what to watch alone, with friends, or with family. Full product spec: [`docs/superpowers/specs/2026-09-08-moffy-mvp-design.md`](docs/superpowers/specs/2026-09-08-moffy-mvp-design.md).

**Not technical? Start with [`FOUNDER_TODO.md`](FOUNDER_TODO.md) instead of this file.**

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 (brand tokens in `app/globals.css`)
- [Supabase](https://supabase.com) — Postgres, Auth
- [TMDB](https://www.themoviedb.org) — movie catalog (not wired up yet)
- [Vercel](https://vercel.com) — deployment

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values, see below
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

See `.env.example` for the full list. All of them are secrets — never commit real values, never prefix a non-`NEXT_PUBLIC_` one with `NEXT_PUBLIC_`. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the two exceptions: Supabase's anon key is designed to be public and is safe under Row Level Security.

## Project structure

```
app/(auth)/            login, signup, server actions
app/(main)/            authenticated shell: home, discover, groups, pathways, friends, search, profile
components/ui/         design system primitives (Button, Card, StarRating, MatchBadge, Avatar)
components/nav/        TopNav (desktop), BottomNav (mobile)
lib/supabase/          browser + server Supabase clients
proxy.ts               session refresh + route guard (Next.js 16's renamed middleware)
supabase/migrations/   SQL schema + RLS, applied via Supabase MCP / CLI
docs/superpowers/      spec, implementation plan, and future sub-project plans
```

## Status

Infrastructure phase (scaffold, brand design system, DB schema + RLS, auth, navigation) — see [`docs/superpowers/plans/2026-09-08-moffy-infrastructure.md`](docs/superpowers/plans/2026-09-08-moffy-infrastructure.md) for the full task-by-task log, including what's blocked and why. Feature work (taste onboarding, TMDB search, recommendations, friends, groups, pathways) hasn't started — each gets its own spec + plan, built incrementally, per the product spec's own instructions (§24).
