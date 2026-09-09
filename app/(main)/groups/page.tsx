import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createGroup } from "./actions";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", user.id);

  const groupIds = (memberRows ?? []).map((m) => m.group_id);
  const { data: groups } =
    groupIds.length > 0
      ? await supabase.from("groups").select("id, name, avatar_url, owner_id").in("id", groupIds)
      : { data: [] };

  const roleByGroupId = new Map((memberRows ?? []).map((m) => [m.group_id, m.role]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-brand-ink">Groups</h1>
        <form action={createGroup} className="mt-3 flex gap-2">
          <input
            name="name"
            placeholder="New group name, e.g. Canım Ailem"
            required
            className="w-full rounded-xl2 border border-white/15 bg-brand-surface px-4 py-2.5 text-brand-ink outline-none focus:border-brand-orange"
          />
          <Button type="submit" className="shrink-0">
            Create
          </Button>
        </form>
      </div>

      {!groups || groups.length === 0 ? (
        <p className="text-sm text-brand-ink/50">
          No groups yet — create one above, or wait for a friend to add you.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((g) => (
            <Link key={g.id} href={`/groups/${g.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:border-brand-orange/40">
                <div className="flex items-center gap-3">
                  <Avatar url={g.avatar_url} name={g.name} />
                  <p className="font-semibold text-brand-ink">{g.name}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-brand-ink/40">
                  {roleByGroupId.get(g.id)}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
