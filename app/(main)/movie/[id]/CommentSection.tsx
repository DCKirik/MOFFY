"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { addComment, deleteComment } from "./actions";

export interface CommentWithAuthor {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl: string | null;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CommentSection({
  movieId,
  initialComments,
  currentUser,
}: {
  movieId: number;
  initialComments: CommentWithAuthor[];
  currentUser: { id: string; name: string; avatarUrl: string | null } | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !currentUser) return;

    const optimistic: CommentWithAuthor = {
      id: `optimistic-${Date.now()}`,
      userId: currentUser.id,
      body,
      createdAt: new Date().toISOString(),
      authorName: currentUser.name,
      authorAvatarUrl: currentUser.avatarUrl,
    };
    setComments((prev) => [optimistic, ...prev]);
    setDraft("");

    startTransition(() => {
      addComment(movieId, body).catch((err) => {
        console.error("comment failed", err);
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      });
    });
  }

  function handleDelete(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    startTransition(() => {
      deleteComment(commentId, movieId).catch((err) => console.error("delete comment failed", err));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-brand-ink/70">
        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </h2>

      {currentUser && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar url={currentUser.avatarUrl} name={currentUser.name} size={36} />
          <div className="flex flex-1 flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share what you thought…"
              rows={2}
              maxLength={2000}
              className="w-full resize-none rounded-xl2 border border-white/10 bg-brand-surface-2 p-3 text-sm text-brand-ink placeholder:text-brand-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!draft.trim() || isPending}
                className="cursor-pointer rounded-xl2 bg-brand-yellow px-4 py-1.5 text-sm font-semibold text-brand-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                Post
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {comments.length === 0 && (
          <p className="text-sm text-brand-ink/50">No comments yet — be the first to say something.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar url={c.authorAvatarUrl} name={c.authorName} size={36} />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-brand-ink">{c.authorName}</span>
                <span className="text-xs text-brand-ink/40">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-brand-ink/80">{c.body}</p>
            </div>
            {currentUser?.id === c.userId && (
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                aria-label="Delete comment"
                className="cursor-pointer self-start text-xs text-brand-ink/30 hover:text-brand-ink/60"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
