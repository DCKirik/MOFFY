"use server";

import { createClient } from "@/lib/supabase/server";
import { getPopularMovies, getMovieDetail } from "@/lib/tmdb/client";
import { cacheMovie } from "@/lib/tmdb/cache";
import { computeTasteProfile } from "@/lib/recommendations/taste-profile";
import { rankCandidatesForGroup } from "@/lib/recommendations/rank-for-group";
import { redirect } from "next/navigation";

export async function createPathway(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const type = formData.get("type") === "main" ? "main" : "themed";
  const name = type === "main" ? "Main Pathway" : String(formData.get("name") ?? "").trim();
  if (type === "themed" && !name) {
    redirect(
      `/groups/${groupId}/pathways/new?type=themed&error=${encodeURIComponent("Name is required for themed pathways")}`,
    );
  }

  const count = Math.min(Math.max(Number(formData.get("count") ?? 10) || 10, 3), 20);
  const excludeGenreIds = new Set(formData.getAll("excludeGenres").map((v) => Number(v)));
  const minRating = formData.get("minRating") ? Number(formData.get("minRating")) : 0;

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  const memberIds = (memberRows ?? []).map((m) => m.user_id);

  const [candidates, tasteProfiles] = await Promise.all([
    getPopularMovies(),
    Promise.all(memberIds.map((uid) => computeTasteProfile(supabase, uid))),
  ]);

  const ranked = rankCandidatesForGroup(candidates, tasteProfiles, {
    excludeGenreIds,
    minRating,
    extreme: false,
    excludeMovieIds: new Set(),
  }).slice(0, count);

  if (ranked.length === 0) {
    redirect(
      `/groups/${groupId}/pathways/new?type=${type}&error=${encodeURIComponent("No movies matched those filters — loosen them and try again")}`,
    );
  }

  const pathwayId = crypto.randomUUID();
  const { error: pathwayError } = await supabase.from("pathways").insert({
    id: pathwayId,
    group_id: groupId,
    name,
    type,
    filters_json: { excludeGenreIds: Array.from(excludeGenreIds), minRating },
    created_by: user.id,
  });
  if (pathwayError) throw new Error(pathwayError.message);

  const details = await Promise.all(ranked.map((r) => getMovieDetail(r.movie.id)));
  await Promise.all(details.map((d) => cacheMovie(d)));

  const { error: moviesError } = await supabase.from("pathway_movies").insert(
    ranked.map((r, i) => ({
      pathway_id: pathwayId,
      movie_id: r.movie.id,
      position: i + 1,
      group_match_score: r.groupScore,
    })),
  );
  if (moviesError) throw new Error(moviesError.message);

  redirect(`/groups/${groupId}/pathways/${pathwayId}`);
}
