"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function rateMovie(movieId: number, rating: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("ratings")
    .upsert({ user_id: user.id, movie_id: movieId, rating }, { onConflict: "user_id,movie_id" });

  if (error) throw new Error(error.message);
  revalidatePath(`/movie/${movieId}`);
}
