import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeTasteProfile } from "@/lib/recommendations/taste-profile";
import { getReelCandidatePool } from "@/lib/tmdb/cache";
import { buildReelQueue } from "@/lib/recommendations/reels";
import { ReelFeed } from "./ReelFeed";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await computeTasteProfile(supabase, user.id);
  const excludeIds = new Set([...profile.ratedMovieIds, ...profile.swipedMovieIds]);
  const candidates = await getReelCandidatePool(supabase, excludeIds);
  const initialQueue = buildReelQueue(candidates, profile, 15);

  return <ReelFeed initialQueue={initialQueue} />;
}
