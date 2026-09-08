export function MatchBadge({ percent }: { percent: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-yellow px-3 py-1 text-sm font-bold text-brand-ink">
      {Math.round(percent)}% Match
    </span>
  );
}
