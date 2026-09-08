"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function addMember(groupId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, role: "member" });

  if (error) throw new Error(error.message);
  revalidatePath(`/groups/${groupId}`);
}

export async function removeMember(groupId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/groups/${groupId}`);
}

export async function promoteToAdmin(groupId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .update({ role: "admin" })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  redirect("/groups");
}
