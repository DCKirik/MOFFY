import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMoviePoolPage } from "@/lib/tmdb/cache";
import { TMDB_GENRES } from "@/lib/tmdb/genres";
import { BROWSE_LANGUAGES } from "@/lib/tmdb/languages";
import { InfiniteMovieGrid } from "@/components/movie/InfiniteMovieGrid";
import { loadMoreDiscoverMovies } from "./actions";

// No auth/cookie read here originally, so Next treated this as eligible
// for build-time static generation — one transient TMDB hiccup during a
// Vercel build then failed the entire deploy (see commit 9b3962f). Forcing
// dynamic moves data fetching to request time, like every other page.
export const dynamic = "force-dynamic";

function chipHref(genreId: number | undefined, lang: string | undefined): string {
  const params = new URLSearchParams();
  if (genreId != null) params.set("genre", String(genreId));
  if (lang) params.set("lang", lang);
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

function chipClass(active: boolean): string {
  return `cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-brand-orange bg-brand-orange text-white"
      : "border-white/15 bg-brand-surface-2 text-brand-ink/80 hover:border-brand-orange/40"
  }`;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; lang?: string }>;
}) {
  const { genre, lang } = await searchParams;
  const genreId = genre ? Number(genre) : undefined;
  const language = lang || undefined;

  const supabase = await createClient();
  const movies = await getMoviePoolPage(supabase, 1, 40, genreId, language);
  const initialMovies = movies.map((m) => ({
    id: m.id,
    title: m.title,
    posterPath: m.poster_path,
    year: m.release_date?.slice(0, 4),
    externalRating: m.vote_average,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-brand-ink">Discover</h1>
        <p className="text-brand-ink/60">
          {language
            ? "Browse by language — best-rated first."
            : "Browse the full Moffy catalog."}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink/40">Genre</p>
        <div className="flex flex-wrap gap-2">
          <Link href={chipHref(undefined, language)} className={chipClass(!genreId)}>
            All
          </Link>
          {TMDB_GENRES.map((g) => (
            <Link key={g.id} href={chipHref(g.id, language)} className={chipClass(genreId === g.id)}>
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-ink/40">Language</p>
        <div className="flex flex-wrap gap-2">
          <Link href={chipHref(genreId, undefined)} className={chipClass(!language)}>
            All
          </Link>
          {BROWSE_LANGUAGES.map((l) => (
            <Link key={l.code} href={chipHref(genreId, l.code)} className={chipClass(language === l.code)}>
              {l.name}
            </Link>
          ))}
        </div>
      </div>

      <InfiniteMovieGrid
        key={`${genreId ?? "all"}-${language ?? "all"}`}
        initialMovies={initialMovies}
        loadMore={loadMoreDiscoverMovies.bind(null, genreId, language)}
      />
    </div>
  );
}
