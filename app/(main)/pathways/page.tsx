import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function PathwaysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);
  const groupIds = (memberRows ?? []).map((m) => m.group_id);

  const { data: groups } =
    groupIds.length > 0
      ? await supabase.from("groups").select("id, name").in("id", groupIds)
      : { data: [] };
  const groupNameById = new Map((groups ?? []).map((g) => [g.id, g.name]));

  const { data: pathways } =
    groupIds.length > 0
      ? await supabase.from("pathways").select("*").in("group_id", groupIds).order("created_at")
      : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-brand-ink">Pathways</h1>

      {!pathways || pathways.length === 0 ? (
        <p className="text-sm text-brand-ink/50">
          No pathways yet — open a group and create one from its Pathways tab.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pathways.map((p) => (
            <Link key={p.id} href={`/groups/${p.group_id}/pathways/${p.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:border-brand-orange/40">
                <div>
                  <p className="font-semibold text-brand-ink">{p.name}</p>
                  <p className="text-xs text-brand-ink/50">{groupNameById.get(p.group_id)}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-brand-ink/40">{p.type}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
