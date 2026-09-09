"use server";

import { createClient } from "@/lib/supabase/server";
import { computeTasteProfile } from "@/lib/recommendations/taste-profile";
import { getReelCandidatePool } from "@/lib/tmdb/cache";
import { buildReelQueue, type ScoredReel } from "@/lib/recommendations/reels";

export async function swipeMovie(movieId: number, liked: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("reel_swipes")
    .upsert({ user_id: user.id, movie_id: movieId, liked }, { onConflict: "user_id,movie_id" });

  if (error) throw new Error(error.message);
}

// Called from the client once the on-screen queue runs low. seenIds
// covers everything already shown/swiped in this session (not yet
// reflected in ratedMovieIds/swipedMovieIds from a fresh taste-profile
// read), so the same trailer never repeats in one sitting.
export async function loadMoreReels(seenIds: number[]): Promise<ScoredReel[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const profile = await computeTasteProfile(supabase, user.id);
  const excludeIds = new Set([...profile.ratedMovieIds, ...profile.swipedMovieIds, ...seenIds]);
  const candidates = await getReelCandidatePool(supabase, excludeIds);
  return buildReelQueue(candidates, profile, 15);
}
