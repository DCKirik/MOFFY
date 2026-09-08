import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { addMember, removeMember, promoteToAdmin, leaveGroup } from "./actions";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase.from("groups").select("*").eq("id", id).maybeSingle();
  if (!group) notFound();

  const { data: memberRows } = await supabase.from("group_members").select("*").eq("group_id", id);
  const members = memberRows ?? [];
  const myMembership = members.find((m) => m.user_id === user.id);
  if (!myMembership) notFound();

  const memberIds = members.map((m) => m.user_id);
  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", memberIds);
  const profileById = new Map((memberProfiles ?? []).map((p) => [p.id, p]));

  const isOwner = myMembership.role === "owner";
  const isOwnerOrAdmin = isOwner || myMembership.role === "admin";

  let addableFriends: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }[] = [];

  if (isOwnerOrAdmin) {
    const { data: friendshipRows } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    const friendIds = (friendshipRows ?? [])
      .map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id))
      .filter((fid) => !memberIds.includes(fid));

    if (friendIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", friendIds);
      addableFriends = data ?? [];
    }
  }

  const roleOrder = { owner: 0, admin: 1, member: 2 } as const;
  const sortedMembers = [...members].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Avatar url={group.avatar_url} name={group.name} size={56} />
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">{group.name}</h1>
          <p className="text-sm text-brand-ink/50">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Members</h2>
        <div className="flex flex-col gap-2">
          {sortedMembers.map((m) => {
            const p = profileById.get(m.user_id);
            if (!p) return null;
            return (
              <Card key={m.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar url={p.avatar_url} name={p.display_name ?? p.username} />
                  <div>
                    <p className="font-semibold text-brand-ink">{p.display_name ?? p.username}</p>
                    <p className="text-xs uppercase tracking-wide text-brand-ink/40">{m.role}</p>
                  </div>
                </div>
                {isOwner && m.user_id !== user.id && (
                  <div className="flex gap-2">
                    {m.role === "member" && (
                      <form action={promoteToAdmin.bind(null, id, m.user_id)}>
                        <Button type="submit" variant="ghost">
                          Make Admin
                        </Button>
                      </form>
                    )}
                    <form action={removeMember.bind(null, id, m.user_id)}>
                      <Button type="submit" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {isOwnerOrAdmin && addableFriends.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Add Friends</h2>
          <div className="flex flex-col gap-2">
            {addableFriends.map((p) => (
              <Card key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar url={p.avatar_url} name={p.display_name ?? p.username} />
                  <p className="font-semibold text-brand-ink">{p.display_name ?? p.username}</p>
                </div>
                <form action={addMember.bind(null, id, p.id)}>
                  <Button type="submit" variant="secondary">
                    Add
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        </section>
      )}

      {!isOwner && (
        <form action={leaveGroup.bind(null, id)}>
          <Button type="submit" variant="ghost">
            Leave Group
          </Button>
        </form>
      )}
    </div>
  );
}
