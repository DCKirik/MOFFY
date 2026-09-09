import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeTasteProfile } from "@/lib/recommendations/taste-profile";
import { getReelCandidatePool } from "@/lib/tmdb/cache";
import { buildReelQueue } from "@/lib/recommendations/reels";
import { getUiLanguage } from "@/lib/i18n/get-language";
import { ReelFeed } from "./ReelFeed";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, lang] = await Promise.all([
    computeTasteProfile(supabase, user.id),
    getUiLanguage(supabase, user.id),
  ]);
  const excludeIds = new Set([...profile.ratedMovieIds, ...profile.swipedMovieIds]);
  const candidates = await getReelCandidatePool(supabase, excludeIds);
  const initialQueue = buildReelQueue(candidates, profile, 15, lang);

  return <ReelFeed initialQueue={initialQueue} uiLanguage={lang} />;
}
