"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Group name is required");

  // Generate the id ourselves rather than using .select().single() on the
  // insert: the groups SELECT policy (is_group_member) depends on the
  // owner's group_members row that the handle_new_group AFTER INSERT
  // trigger creates, and Postgres evaluates RETURNING's RLS visibility
  // against a snapshot that doesn't reliably see that trigger's own write
  // yet — it surfaces as "new row violates row-level security policy"
  // even though the insert itself succeeded. Knowing the id upfront avoids
  // needing RETURNING at all.
  const groupId = crypto.randomUUID();
  const { error } = await supabase.from("groups").insert({ id: groupId, name, owner_id: user.id });

  if (error) throw new Error(error.message);
  redirect(`/groups/${groupId}`);
}
