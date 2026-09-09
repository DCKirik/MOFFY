import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getMovieDetail } from "@/lib/tmdb/client";
import { cacheMovie } from "@/lib/tmdb/cache";
import { tmdbImage } from "@/lib/tmdb/image";
import { createClient } from "@/lib/supabase/server";
import { computeTasteProfile } from "@/lib/recommendations/taste-profile";
import { computeMoffyMatch } from "@/lib/recommendations/moffy-match";
import { detailToMatchable } from "@/lib/recommendations/adapters";
import { Card } from "@/components/ui/Card";
import { MatchBadge } from "@/components/ui/MatchBadge";
import { TrailerButton } from "@/components/movie/TrailerButton";
import { RatingControl } from "./RatingControl";
import { CommentSection, type CommentWithAuthor } from "./CommentSection";
import { pickTrailerKey } from "@/lib/tmdb/client";
import { languageName } from "@/lib/tmdb/languages";

function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const detail = await getMovieDetail(id).catch(() => null);
  if (!detail) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [, communityRatingRes, myRatingRes, watchedRes, profile, commentsRes] = await Promise.all([
    cacheMovie(detail),
    supabase.rpc("movie_community_rating", { p_movie_id: id }).maybeSingle(),
    user
      ? supabase.from("ratings").select("rating").eq("user_id", user.id).eq("movie_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("watch_history")
          .select("watched_at")
          .eq("user_id", user.id)
          .eq("movie_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user ? computeTasteProfile(supabase, user.id) : Promise.resolve(null),
    supabase
      .from("movie_comments")
      .select("id, user_id, body, created_at")
      .eq("movie_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const community = communityRatingRes.data;
  const myRating = myRatingRes.data?.rating ?? 0;
  const watched = Boolean(watchedRes.data);
  const matchPercent = profile ? computeMoffyMatch(profile, detailToMatchable(detail)) : null;

  const rawComments = commentsRes.data ?? [];
  const authorIds = Array.from(new Set([...rawComments.map((c) => c.user_id), ...(user ? [user.id] : [])]));
  const { data: authorProfiles } = authorIds.length
    ? await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", authorIds)
    : { data: [] };
  const profileById = new Map((authorProfiles ?? []).map((p) => [p.id, p]));

  const comments: CommentWithAuthor[] = rawComments.map((c) => {
    const author = profileById.get(c.user_id);
    return {
      id: c.id,
      userId: c.user_id,
      body: c.body,
      createdAt: c.created_at,
      authorName: author?.display_name ?? author?.username ?? "Moffy user",
      authorAvatarUrl: author?.avatar_url ?? null,
    };
  });

  const myProfile = user ? profileById.get(user.id) : undefined;
  const currentUser = user
    ? {
        id: user.id,
        name: myProfile?.display_name ?? myProfile?.username ?? "You",
        avatarUrl: myProfile?.avatar_url ?? null,
      }
    : null;

  const backdrop = tmdbImage(detail.backdrop_path, "original");
  const poster = tmdbImage(detail.poster_path, "w500");
  const director = detail.credits?.crew?.find((c) => c.job === "Director")?.name;
  const cast = (detail.credits?.cast ?? []).slice(0, 6);
  const trProviders = detail["watch/providers"]?.results?.TR;
  const runtime = formatRuntime(detail.runtime);
  const studio = detail.production_companies?.[0]?.name;
  const keywords = (detail.keywords?.keywords ?? []).slice(0, 8);
  const trailerKey = pickTrailerKey(detail);
  const originalLanguageName = languageName(detail.original_language);
  const otherLanguages = (detail.spoken_languages ?? [])
    .filter((l) => l.iso_639_1 !== detail.original_language)
    .map((l) => l.english_name || l.name)
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      {backdrop && (
        <div className="relative -mx-6 -mt-8 aspect-[21/9] overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-xl2">
          <Image src={backdrop} alt="" fill priority className="object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto w-48 shrink-0 sm:mx-0">
          {poster ? (
            <Image
              src={poster}
              alt={detail.title}
              width={342}
              height={513}
              className="rounded-xl2 object-cover transition-shadow duration-300 shadow-[0_0_24px_3px_rgba(255,199,44,0.14)] hover:shadow-[0_0_40px_10px_rgba(255,199,44,0.32)]"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-xl2 bg-brand-surface p-4 text-center text-sm">
              {detail.title}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-brand-ink">{detail.title}</h1>
            {matchPercent != null && <MatchBadge percent={matchPercent} />}
          </div>
          <p className="text-sm text-brand-ink/60">
            {[
              detail.release_date?.slice(0, 4),
              runtime,
              detail.genres.map((g) => g.name).join(", "),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {director && <p className="text-sm text-brand-ink/60">Directed by {director}</p>}
          {studio && <p className="text-sm text-brand-ink/60">{studio}</p>}

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span>
              ★ {detail.vote_average.toFixed(1)} external ({detail.vote_count.toLocaleString()})
            </span>
            <span>
              ★ {community?.avg_rating ? Number(community.avg_rating).toFixed(1) : "—"} Moffy community
              {community?.rating_count ? ` (${community.rating_count})` : ""}
            </span>
            {watched && (
              <span className="rounded-full bg-brand-yellow/15 px-2.5 py-0.5 text-xs font-bold uppercase text-brand-yellow">
                Watched
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {trailerKey && <TrailerButton videoKey={trailerKey} title={detail.title} />}
            <RatingControl movieId={id} initialRating={myRating} />
          </div>

          <p className="max-w-2xl text-brand-ink/80">{detail.overview}</p>

          {cast.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-brand-ink/70">Cast</h2>
              <p className="text-sm text-brand-ink/60">{cast.map((c) => c.name).join(", ")}</p>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span
                  key={k.id}
                  className="rounded-full bg-brand-surface-2 px-2.5 py-1 text-xs text-brand-ink/60"
                >
                  {k.name}
                </span>
              ))}
            </div>
          )}

          {originalLanguageName && (
            <div>
              <h2 className="text-sm font-semibold text-brand-ink/70">Language</h2>
              <p className="text-sm text-brand-ink/60">
                Original:{" "}
                <Link
                  href={`/discover?lang=${detail.original_language}`}
                  className="font-medium text-brand-orange hover:underline"
                >
                  {originalLanguageName}
                </Link>
                {otherLanguages.length > 0 && ` · Also available in ${otherLanguages.join(", ")}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Streaming in Türkiye</h2>
        {trProviders?.flatrate?.length ? (
          <div className="flex flex-wrap gap-3">
            {trProviders.flatrate.map((p) => (
              <div
                key={p.provider_id}
                className="flex items-center gap-2 rounded-lg bg-brand-surface-2 px-3 py-1.5"
              >
                {p.logo_path && (
                  <Image
                    src={tmdbImage(p.logo_path, "w200")!}
                    alt={p.provider_name}
                    width={20}
                    height={20}
                    className="rounded"
                  />
                )}
                <span className="text-sm">{p.provider_name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-ink/50">Not currently available to stream in Türkiye.</p>
        )}
      </Card>

      <Card>
        <CommentSection movieId={id} initialComments={comments} currentUser={currentUser} />
      </Card>
    </div>
  );
}
