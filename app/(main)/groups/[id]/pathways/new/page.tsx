import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TMDB_GENRES } from "@/lib/tmdb/genres";
import { createPathway } from "../actions";

export default async function NewPathwayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; error?: string }>;
}) {
  const { id: groupId } = await params;
  const { type, error } = await searchParams;
  const pathwayType = type === "main" ? "main" : "themed";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-brand-ink">
        {pathwayType === "main" ? "Create Main Pathway" : "New Themed Pathway"}
      </h1>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Card>
        <form action={createPathway.bind(null, groupId)} className="flex flex-col gap-5">
          <input type="hidden" name="type" value={pathwayType} />

          {pathwayType === "themed" && (
            <label className="flex flex-col gap-1 text-sm font-medium">
              Pathway name
              <input
                name="name"
                required
                placeholder="e.g. Halloween Horror"
                className="rounded-xl2 border border-black/10 px-3 py-2 outline-none focus:border-brand-orange"
              />
            </label>
          )}

          <label className="flex w-32 flex-col gap-1 text-sm font-medium">
            Number of movies
            <input
              type="number"
              name="count"
              defaultValue={10}
              min={3}
              max={20}
              className="rounded-xl2 border border-black/10 px-3 py-2"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold text-brand-ink/70">Exclude genres</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {TMDB_GENRES.map((g) => (
                <label key={g.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="excludeGenres" value={g.id} />
                  {g.name}
                </label>
              ))}
            </div>
          </div>

          <label className="flex w-32 flex-col gap-1 text-sm font-medium">
            Minimum rating
            <input
              type="number"
              name="minRating"
              min={0}
              max={10}
              step={0.5}
              className="rounded-xl2 border border-black/10 px-3 py-2"
            />
          </label>

          <Button type="submit" className="self-start">
            Generate Pathway
          </Button>
        </form>
      </Card>
    </div>
  );
}
