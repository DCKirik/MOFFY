import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { sendFriendRequest, acceptFriendRequest, removeFriendship } from "./actions";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: friendshipRows } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const rows = friendshipRows ?? [];
  const otherUserIds = new Set<string>();
  for (const f of rows) {
    otherUserIds.add(f.requester_id === user.id ? f.addressee_id : f.requester_id);
  }

  let searchResults: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }[] = [];

  if (query) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .ilike("username", `%${query}%`)
      .neq("id", user.id)
      .limit(20);
    searchResults = data ?? [];
    for (const r of searchResults) otherUserIds.add(r.id);
  }

  const { data: profilesData } =
    otherUserIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", Array.from(otherUserIds))
      : { data: [] };

  const profileById = new Map((profilesData ?? []).map((p) => [p.id, p]));

  const friends = rows.filter((f) => f.status === "accepted");
  const incoming = rows.filter((f) => f.status === "pending" && f.addressee_id === user.id);
  const outgoingIds = new Set(
    rows
      .filter((f) => f.status === "pending" && f.requester_id === user.id)
      .map((f) => f.addressee_id),
  );
  const friendIds = new Set(
    friends.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id)),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-brand-ink">Friends</h1>
        <form className="mt-3 flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by username"
            className="w-full rounded-xl2 border border-white/15 bg-brand-surface px-4 py-2.5 text-brand-ink outline-none focus:border-brand-orange"
          />
          <button
            type="submit"
            className="shrink-0 cursor-pointer rounded-xl2 bg-brand-yellow px-5 py-2.5 font-semibold text-brand-bg transition-colors hover:bg-brand-yellow-dark"
          >
            Search
          </button>
        </form>
      </div>

      {query && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Search Results</h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-brand-ink/50">No users found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map((p) => (
                <Card key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar url={p.avatar_url} name={p.display_name ?? p.username} />
                    <div>
                      <p className="font-semibold text-brand-ink">{p.display_name ?? p.username}</p>
                      <p className="text-xs text-brand-ink/50">@{p.username}</p>
                    </div>
                  </div>
                  {friendIds.has(p.id) ? (
                    <span className="text-sm text-brand-ink/50">Friends</span>
                  ) : outgoingIds.has(p.id) ? (
                    <span className="text-sm text-brand-ink/50">Requested</span>
                  ) : (
                    <form action={sendFriendRequest.bind(null, p.id)}>
                      <Button type="submit" variant="secondary">
                        Add Friend
                      </Button>
                    </form>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Friend Requests</h2>
          <div className="flex flex-col gap-2">
            {incoming.map((f) => {
              const p = profileById.get(f.requester_id);
              if (!p) return null;
              return (
                <Card key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar url={p.avatar_url} name={p.display_name ?? p.username} />
                    <div>
                      <p className="font-semibold text-brand-ink">{p.display_name ?? p.username}</p>
                      <p className="text-xs text-brand-ink/50">@{p.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={acceptFriendRequest.bind(null, f.id)}>
                      <Button type="submit">Accept</Button>
                    </form>
                    <form action={removeFriendship.bind(null, f.id)}>
                      <Button type="submit" variant="ghost">
                        Reject
                      </Button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-brand-ink/70">Your Friends</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-brand-ink/50">No friends yet — search above to add some.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((f) => {
              const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
              const p = profileById.get(otherId);
              if (!p) return null;
              return (
                <Card key={f.id} className="flex items-center gap-3">
                  <Avatar url={p.avatar_url} name={p.display_name ?? p.username} />
                  <div>
                    <p className="font-semibold text-brand-ink">{p.display_name ?? p.username}</p>
                    <p className="text-xs text-brand-ink/50">@{p.username}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
