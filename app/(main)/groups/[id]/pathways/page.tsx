import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function GroupPathwaysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
  if (!group) notFound();

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!myMembership) notFound();
  const canCreate = myMembership.role === "owner" || myMembership.role === "admin";

  const { data: pathways } = await supabase
    .from("pathways")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at");

  const mainPathway = (pathways ?? []).find((p) => p.type === "main");
  const themedPathways = (pathways ?? []).filter((p) => p.type === "themed");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl text-brand-ink">{group.name} — Pathways</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Main Pathway</h2>
        {mainPathway ? (
          <Link href={`/groups/${groupId}/pathways/${mainPathway.id}`}>
            <Card className="transition-colors hover:border-brand-orange/40">{mainPathway.name}</Card>
          </Link>
        ) : canCreate ? (
          <Link href={`/groups/${groupId}/pathways/new?type=main`}>
            <Button>Create Main Pathway</Button>
          </Link>
        ) : (
          <p className="text-sm text-brand-ink/50">The group owner/admin hasn&apos;t created one yet.</p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-ink/70">Themed Pathways</h2>
          {canCreate && (
            <Link href={`/groups/${groupId}/pathways/new?type=themed`}>
              <Button variant="ghost">+ New Themed Pathway</Button>
            </Link>
          )}
        </div>
        {themedPathways.length === 0 ? (
          <p className="text-sm text-brand-ink/50">No themed pathways yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {themedPathways.map((p) => (
              <Link key={p.id} href={`/groups/${groupId}/pathways/${p.id}`}>
                <Card className="transition-colors hover:border-brand-orange/40">{p.name}</Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
