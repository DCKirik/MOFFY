import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tmdbImage } from "@/lib/tmdb/image";
import { Avatar } from "@/components/ui/Avatar";
import { markWatched } from "./actions";

export default async function PathwayDetailPage({
  params,
}: {
  params: Promise<{ id: string; pathwayId: string }>;
}) {
  const { id: groupId, pathwayId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pathway } = await supabase.from("pathways").select("*").eq("id", pathwayId).maybeSingle();
  if (!pathway || pathway.group_id !== groupId) notFound();

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  const memberIds = (memberRows ?? []).map((m) => m.user_id);
  if (!memberIds.includes(user.id)) notFound();

  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", memberIds);
  const profileById = new Map((memberProfiles ?? []).map((p) => [p.id, p]));

  const { data: pathwayMovieRows } = await supabase
    .from("pathway_movies")
    .select("*")
    .eq("pathway_id", pathwayId)
    .order("position");
  const pathwayMovies = pathwayMovieRows ?? [];
  const movieIds = pathwayMovies.map((m) => m.movie_id);

  const { data: movieCacheRows } = await supabase
    .from("movies_cache")
    .select("tmdb_id, title, poster_path")
    .in("tmdb_id", movieIds.length > 0 ? movieIds : [0]);
  const movieById = new Map((movieCacheRows ?? []).map((m) => [m.tmdb_id, m]));

  const { data: progressRows } = await supabase
    .from("pathway_progress")
    .select("*")
    .eq("pathway_id", pathwayId);
  const progress = progressRows ?? [];

  const watchedByMovie = new Map<number, Set<string>>();
  for (const row of progress) {
    if (row.status !== "watched") continue;
    if (!watchedByMovie.has(row.movie_id)) watchedByMovie.set(row.movie_id, new Set());
    watchedByMovie.get(row.movie_id)!.add(row.user_id);
  }

  const watchedCountByMember = new Map<string, number>();
  for (const id of memberIds) {
    watchedCountByMember.set(
      id,
      pathwayMovies.filter((pm) => watchedByMovie.get(pm.movie_id)?.has(id)).length,
    );
  }

  const myWatchedSet = new Set(
    progress.filter((p) => p.user_id === user.id && p.status === "watched").map((p) => p.movie_id),
  );

  const total = pathwayMovies.length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-brand-ink">{pathway.name}</h1>
        <p className="text-sm text-brand-ink/50">
          {pathway.type === "main" ? "Main Pathway" : "Themed Pathway"} · {total} movies ·{" "}
          {memberIds.length} members
        </p>
      </div>

      {total === 0 ? (
        <p className="text-sm text-brand-ink/50">This pathway has no movies yet.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-brand-ink/40">
              Start
            </span>
            {pathwayMovies.map((pm, i) => {
              const movie = movieById.get(pm.movie_id);
              const watchedBy = watchedByMovie.get(pm.movie_id) ?? new Set();
              const groupComplete = memberIds.length > 0 && memberIds.every((id) => watchedBy.has(id));
              const iWatched = myWatchedSet.has(pm.movie_id);
              const poster = movie ? tmdbImage(movie.poster_path, "w200") : null;

              return (
                <div
                  key={pm.movie_id}
                  className="flex shrink-0 items-center opacity-0 [animation-fill-mode:backwards]"
                  style={{ animation: "stagger-in 0.45s ease-out backwards", animationDelay: `${i * 45}ms` }}
                >
                  {i > 0 && (
                    <div
                      className={`h-0.5 w-6 shrink-0 transition-colors duration-500 ${
                        watchedByMovie.get(pathwayMovies[i - 1].movie_id)?.size ===
                          memberIds.length && memberIds.length > 0
                          ? "bg-brand-orange"
                          : "bg-white/10"
                      }`}
                    />
                  )}
                  <div className="flex w-20 flex-col items-center gap-1.5">
                    <Link
                      href={`/movie/${pm.movie_id}`}
                      className={`relative block h-16 w-16 overflow-hidden rounded-full border-4 transition-all duration-300 hover:scale-105 ${
                        groupComplete
                          ? "border-brand-orange shadow-[0_0_20px_4px_rgba(255,106,26,0.35)]"
                          : "border-white/15"
                      }`}
                    >
                      {poster ? (
                        <Image
                          src={poster}
                          alt={movie?.title ?? ""}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-surface-2 text-[10px]">
                          {movie?.title}
                        </div>
                      )}
                    </Link>
                    <p className="w-20 truncate text-center text-[11px] font-medium text-brand-ink">
                      {movie?.title ?? "…"}
                    </p>
                    <form action={markWatched.bind(null, groupId, pathwayId, pm.movie_id)}>
                      <button
                        type="submit"
                        disabled={iWatched}
                        className={`cursor-pointer text-[10px] font-semibold uppercase transition-colors disabled:cursor-default ${
                          iWatched ? "text-brand-orange" : "text-brand-ink/40 hover:text-brand-orange"
                        }`}
                      >
                        {iWatched ? "✓ Watched" : "Mark watched"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
            <span className="ml-2 shrink-0 text-xs font-bold uppercase tracking-wide text-brand-ink/40">
              Finish
            </span>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Progress</h2>
            <div className="flex flex-col gap-3">
              {memberIds.map((id, i) => {
                const p = profileById.get(id);
                if (!p) return null;
                const watched = watchedCountByMember.get(id) ?? 0;
                const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 opacity-0"
                    style={{ animation: "stagger-in 0.4s ease-out backwards", animationDelay: `${i * 60}ms` }}
                  >
                    <Avatar url={p.avatar_url} name={p.display_name ?? p.username} size={32} />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-brand-ink/60">
                        <span>{p.display_name ?? p.username}</span>
                        <span>
                          {watched}/{total}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-brand-orange shadow-[0_0_8px_1px_rgba(255,106,26,0.5)] transition-[width] duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
