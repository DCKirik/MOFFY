"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markWatched(groupId: string, pathwayId: string, movieId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("pathway_progress").upsert(
    {
      pathway_id: pathwayId,
      movie_id: movieId,
      user_id: user.id,
      status: "watched",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "pathway_id,movie_id,user_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/groups/${groupId}/pathways/${pathwayId}`);
}
