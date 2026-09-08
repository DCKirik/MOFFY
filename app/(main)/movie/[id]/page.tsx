import { notFound } from "next/navigation";
import Image from "next/image";
import { getMovieDetail } from "@/lib/tmdb/client";
import { cacheMovie } from "@/lib/tmdb/cache";
import { tmdbImage } from "@/lib/tmdb/image";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { RatingControl } from "./RatingControl";

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

  const [, communityRatingRes, myRatingRes, watchedRes] = await Promise.all([
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
  ]);

  const community = communityRatingRes.data;
  const myRating = myRatingRes.data?.rating ?? 0;
  const watched = Boolean(watchedRes.data);

  const backdrop = tmdbImage(detail.backdrop_path, "original");
  const poster = tmdbImage(detail.poster_path, "w500");
  const director = detail.credits?.crew?.find((c) => c.job === "Director")?.name;
  const cast = (detail.credits?.cast ?? []).slice(0, 6);
  const trProviders = detail["watch/providers"]?.results?.TR;
  const runtime = formatRuntime(detail.runtime);

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
              className="rounded-xl2 object-cover shadow-md"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-xl2 bg-black/5 p-4 text-center text-sm">
              {detail.title}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <h1 className="text-3xl font-bold text-brand-ink">{detail.title}</h1>
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

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span>
              ★ {detail.vote_average.toFixed(1)} external ({detail.vote_count.toLocaleString()})
            </span>
            <span>
              ★ {community?.avg_rating ? Number(community.avg_rating).toFixed(1) : "—"} Moffy community
              {community?.rating_count ? ` (${community.rating_count})` : ""}
            </span>
            {watched && (
              <span className="rounded-full bg-brand-yellow/40 px-2.5 py-0.5 text-xs font-bold uppercase text-brand-ink">
                Watched
              </span>
            )}
          </div>

          <RatingControl movieId={id} initialRating={myRating} />

          <p className="max-w-2xl text-brand-ink/80">{detail.overview}</p>

          {cast.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-brand-ink/70">Cast</h2>
              <p className="text-sm text-brand-ink/60">{cast.map((c) => c.name).join(", ")}</p>
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
                className="flex items-center gap-2 rounded-lg bg-black/5 px-3 py-1.5"
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
    </div>
  );
}
