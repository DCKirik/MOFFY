import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/tmdb/image";
import { MatchBadge } from "@/components/ui/MatchBadge";

export function MovieCard({
  id,
  title,
  posterPath,
  year,
  externalRating,
  matchPercent,
}: {
  id: number;
  title: string;
  posterPath: string | null;
  year?: string | number | null;
  externalRating?: number | null;
  matchPercent?: number | null;
}) {
  const poster = tmdbImage(posterPath, "w342");
  return (
    <Link href={`/movie/${id}`} className="group block w-36 shrink-0 sm:w-44">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl2 bg-black/5">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="(max-width: 640px) 144px, 176px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-brand-ink/50">
            {title}
          </div>
        )}
        {matchPercent != null && (
          <div className="absolute left-2 top-2">
            <MatchBadge percent={matchPercent} />
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-brand-ink">{title}</p>
      <p className="text-xs text-brand-ink/60">
        {year ?? ""}
        {externalRating != null && year ? " · " : ""}
        {externalRating != null ? `★ ${externalRating.toFixed(1)}` : ""}
      </p>
    </Link>
  );
}
