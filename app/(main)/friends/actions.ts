"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendFriendRequest(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: targetUserId });

  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);

  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}

export async function removeFriendship(friendshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);

  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}
