"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useReactions } from "../../../components/ReactionContext";

// Post shape aligned to backend response
type UserRef =
  | { _id?: string; username?: string; email?: string }
  | string
  | null;
type CommentItem = {
  _id?: string;
  comment?: string;
  postedBy?: UserRef;
  createdAt?: string;
  isAnonymous?: boolean;
};
type CommentNode = CommentItem & {
  likesCount?: number;
  dislikesCount?: number;
  reactionSummary?: Record<string, number>;
  currentUserReaction?: string | null;
  replies?: CommentNode[];
};
type Post = {
  _id?: string;
  id?: string;
  title?: string;
  content?: string;
  mood?: string;
  isAnonymous?: boolean;
  postedBy?: UserRef;
  createdAt?: string;
  updatedAt?: string;
  reactions?: Record<string, any>;
  comments?: CommentItem[];
};

export default function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { react, pending } = useReactions();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyAnon, setReplyAnon] = useState<Record<string, boolean>>({});

  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
    []
  );

  const EMOJIS = useMemo(() => ["👍", "❤️", "😂", "😮", "😢", "👎"], []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setError(null);
        setAuthError(false);
        setLoading(true);
        const { data } = await api.get(`/post/${id}`);
        if (!data || !data._id) {
          setError("Post not found");
          setPost(null);
          return;
        }
        setPost(data as Post);
        // Load nested comments
        try {
          setCommentsLoading(true);
          const { data: cdata } = await api.get(`/comments/by-post/${id}`);
          setComments(Array.isArray(cdata?.comments) ? cdata.comments : []);
        } catch (_) {
          setComments([]);
        } finally {
          setCommentsLoading(false);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const msg =
          status === 401
            ? "Please log in to view this post."
            : err?.response?.data?.error ||
              err?.response?.data?.message ||
              err?.message ||
              "Failed to load post";
        setAuthError(status === 401);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPost();
  }, [API_BASE, id]);

  const reloadComments = async () => {
    try {
      setCommentsLoading(true);
      const { data } = await api.get(`/comments/by-post/${id}`);
      setComments(Array.isArray(data?.comments) ? data.comments : []);
    } catch {
      // ignore
    } finally {
      setCommentsLoading(false);
    }
  };

  const applyReactionToState = (
    list: CommentNode[],
    commentId: string,
    reactionSummary?: Record<string, number>,
    currentUserReaction?: string | null,
    likesCount?: number,
    dislikesCount?: number
  ): CommentNode[] =>
    list.map((c) => {
      if (c._id === commentId) {
        return {
          ...c,
          reactionSummary: reactionSummary ?? c.reactionSummary,
          currentUserReaction: typeof currentUserReaction === "undefined" ? c.currentUserReaction : currentUserReaction,
          likesCount: typeof likesCount === "number" ? likesCount : c.likesCount,
          dislikesCount: typeof dislikesCount === "number" ? dislikesCount : c.dislikesCount,
        };
      }
      if (Array.isArray(c.replies) && c.replies.length) {
        return {
          ...c,
          replies: c.replies.map((rc) =>
            rc._id === commentId
              ? {
                  ...rc,
                  reactionSummary: reactionSummary ?? rc.reactionSummary,
                  currentUserReaction: typeof currentUserReaction === "undefined" ? rc.currentUserReaction : currentUserReaction,
                  likesCount: typeof likesCount === "number" ? likesCount : rc.likesCount,
                  dislikesCount: typeof dislikesCount === "number" ? dislikesCount : rc.dislikesCount,
                }
              : rc
          ),
        };
      }
      return c;
    });

  const reactWithEmoji = async (commentId: string, emoji: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setSubmitMsg("Login required to react to comments.");
        return;
      }
      const { reactionSummary, currentUserReaction, likesCount, dislikesCount } = await react(commentId, emoji);
      setComments((prev) => applyReactionToState(prev, commentId, reactionSummary, currentUserReaction, likesCount, dislikesCount));
      // no refetch -> avoid flicker; backend already returns canonical summary
    } catch (e: any) {
      setSubmitMsg(e?.response?.data?.message || e?.message || "Failed to react");
    }
  };

  const toggleReply = (cid: string) => {
    setReplyOpen((s) => ({ ...s, [cid]: !s[cid] }));
  };

  const submitReply = async (parentId: string) => {
    const text = (replyText[parentId] || "").trim();
    if (!text) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setSubmitMsg("You need to be logged in to reply.");
        return;
      }
      await api.post(`/comments/create`, {
        postId: id,
        comment: text,
        isAnonymous: replyAnon[parentId] ?? true,
        parentComment: parentId,
      });
      setReplyText((s) => ({ ...s, [parentId]: "" }));
      setReplyAnon((s) => ({ ...s, [parentId]: true }));
      setReplyOpen((s) => ({ ...s, [parentId]: false }));
      await reloadComments();
    } catch (e: any) {
      setSubmitMsg(e?.response?.data?.message || e?.message || "Failed to reply");
    }
  };

  const displayName = (p: Post) => {
    if (p.isAnonymous) return "Anonymous";
    if (p.postedBy && typeof p.postedBy === "object" && p.postedBy.username)
      return p.postedBy.username as string;
    if (typeof p.postedBy === "string") return p.postedBy;
    return "User";
  };
  const dateStr = (p: Post) =>
    p.createdAt ? new Date(p.createdAt).toLocaleString() : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg(null);
    if (!comment.trim()) {
      setSubmitMsg("Please write a comment before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setSubmitMsg("You need to be logged in to comment.");
        setSubmitting(false);
        return;
      }
      await api.post(`/comments/create`, { postId: id, comment, isAnonymous });
      setSubmitMsg("Comment posted!");
      setComment("");
      setIsAnonymous(true);
      // Reload comments
      await reloadComments();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to post comment";
      setSubmitMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 pt-6 pb-10 bg-[var(--page-bg)] text-[var(--text)]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(1000px_400px_at_10%_0%,var(--accent-16a),transparent_60%)] blur-[24px]" />

      {loading && (
        <div className="relative z-10 grid gap-4 max-w-[1100px] mx-auto grid-cols-1 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <div className="h-8 w-2/3 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] animate-pulse" />
            <div className="h-3.5 w-2/5 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] animate-pulse" />
            <div className="h-[200px] rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] animate-pulse" />
          </div>
          <div className="h-[300px] rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] animate-pulse" />
        </div>
      )}

      {!loading && error && (
        <div className="relative z-10 max-w-[1100px] mx-auto">
          <div className="p-4 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] text-[var(--text-strong)]">
            <div className="mb-2">{error}</div>
            {authError && (
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-35a)] bg-[var(--btn-primary-bg)] text-[var(--text-strong)] font-bold px-4 py-2 hover:shadow-[var(--hover-shadow)]">Go to Login</Link>
            )}
          </div>
        </div>
      )}

      {!loading && !error && post && (
        <div className="relative z-10 grid gap-4 max-w-[1100px] mx-auto grid-cols-1 lg:grid-cols-[2fr_1fr]">
          <div>
            <header className="pt-4">
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                <span className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)]">{post.mood || "neutral"}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-60" />
                <span>{displayName(post)}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-60" />
                <span>{dateStr(post)}</span>
              </div>
              <h1 className="mt-2 text-[32px] text-[var(--text-strong)]">{post.title || "Untitled"}</h1>
            </header>
            <article className="relative overflow-hidden rounded-2xl p-4 border bg-[var(--panel-bg)] border-[var(--panel-border)]">
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[var(--panel-gloss)]" />
              <p className="m-0 whitespace-pre-wrap relative">{post.content}</p>
            </article>
            <article className="relative overflow-hidden rounded-2xl p-4 border bg-[var(--panel-bg)] border-[var(--panel-border)]">
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[var(--panel-gloss)]" />
              <div className="flex items-center justify-between">
                <h3 className="m-0 mb-1 text-[var(--text-strong)]">Comments</h3>
                {commentsLoading ? <span className="text-[12px] text-[var(--text-muted)]">Loading…</span> : null}
              </div>
              <ul className="m-0 mt-2 p-0 list-none grid gap-2.5">
                {comments.length === 0 && !commentsLoading && (
                  <li className="text-[13px] text-[var(--text-muted)]">No comments yet.</li>
                )}
                {comments.map((c) => {
                  const who = c?.isAnonymous
                    ? "Anonymous"
                    : c?.postedBy && typeof c.postedBy === "object" && (c.postedBy as any).username
                    ? ((c.postedBy as any).username as string)
                    : typeof c?.postedBy === "string"
                    ? (c.postedBy as string)
                    : "User";
                  return (
                    <li key={c?._id} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)]">
                      <div className="text-[12px] text-[var(--text-muted)] mb-1">
                        {who}
                        {c?.createdAt ? ` • ${new Date(c.createdAt).toLocaleString()}` : ""}
                      </div>
                      <div className="text-[var(--text)] whitespace-pre-wrap">{c?.comment}</div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {EMOJIS.map((e) => {
                          const count = c?.reactionSummary?.[e] ?? 0;
                          const active = c?.currentUserReaction === e;
                          return (
                            <button
                              key={e}
                              type="button"
                              className={`text-xs px-2 py-1 rounded-lg border bg-transparent ${active ? "border-[var(--accent-35a)]" : "border-[var(--border)]"}`}
                              disabled={!!(c?._id && pending[c._id])}
                              onClick={() => c?._id && reactWithEmoji(c._id, e)}
                              title={e}
                            >
                              {e} {count}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-transparent"
                          onClick={() => c?._id && toggleReply(c._id)}
                        >
                          Reply
                        </button>
                      </div>
                      {c?._id && replyOpen[c._id] && (
                        <div className="mt-2 grid gap-2">
                          <textarea
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] px-3 py-2 outline-none resize-y"
                            placeholder="Write a reply…"
                            rows={3}
                            value={replyText[c._id] || ""}
                            onChange={(e) => setReplyText((s) => ({ ...s, [c._id!]: e.target.value }))}
                          />
                          <label className="inline-flex items-center gap-2 text-xs text-[var(--text)]">
                            <input
                              type="checkbox"
                              checked={replyAnon[c._id] ?? true}
                              onChange={(e) => setReplyAnon((s) => ({ ...s, [c._id!]: e.target.checked }))}
                            />
                            <span>Reply as Anonymous</span>
                          </label>
                          <div className="flex gap-2">
                            <button
                              className="text-xs rounded-xl border border-[var(--accent-35a)] bg-[var(--btn-primary-bg)] text-[var(--text-strong)] font-bold px-3 py-1"
                              onClick={() => submitReply(c._id!)}
                            >
                              Post Reply
                            </button>
                            <button
                              className="text-xs rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] px-3 py-1"
                              onClick={() => toggleReply(c._id!)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {Array.isArray(c?.replies) && c.replies.length > 0 && (
                        <ul className="m-0 mt-2 ml-4 p-0 list-none grid gap-2">
                          {c.replies.map((rc) => {
                            const rwho = rc?.isAnonymous
                              ? "Anonymous"
                              : rc?.postedBy && typeof rc.postedBy === "object" && (rc.postedBy as any).username
                              ? ((rc.postedBy as any).username as string)
                              : typeof rc?.postedBy === "string"
                              ? (rc.postedBy as string)
                              : "User";
                            return (
                              <li key={rc?._id} className="p-2 rounded-xl border border-[var(--border)] bg-[var(--panel-bg)]">
                                <div className="text-[12px] text-[var(--text-muted)] mb-1">
                                  {rwho}
                                  {rc?.createdAt ? ` • ${new Date(rc.createdAt).toLocaleString()}` : ""}
                                </div>
                                <div className="text-[var(--text)] whitespace-pre-wrap">{rc?.comment}</div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {EMOJIS.map((e) => {
                                    const count = rc?.reactionSummary?.[e] ?? 0;
                                    const active = rc?.currentUserReaction === e;
                                    return (
                                      <button
                                        key={e}
                                        type="button"
                                        className={`text-xs px-2 py-1 rounded-lg border bg-transparent ${active ? "border-[var(--accent-35a)]" : "border-[var(--border)]"}`}
                                        disabled={!!(rc?._id && pending[rc._id])}
                                        onClick={() => rc?._id && reactWithEmoji(rc._id, e)}
                                        title={e}
                                      >
                                        {e} {count}
                                      </button>
                                    );
                                  })}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          </div>

          <aside>
            <form className="relative grid gap-2 p-4 rounded-2xl border bg-[var(--panel-bg)] border-[var(--panel-border)] content-start" onSubmit={onSubmit}>
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[var(--panel-gloss)]" />
              <h3 className="m-0 mb-1 text-[var(--text-strong)]">Leave a Comment</h3>
              <label className="text-[13px] text-[var(--text-muted)]" htmlFor="comment">Comment</label>
              <textarea
                id="comment"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] px-3 py-2.5 outline-none resize-y"
                placeholder="Write your thoughts..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
              />

              <label className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <span>Post as Anonymous</span>
              </label>

              {submitMsg && <div className="text-[13px] text-[var(--text-muted)]">{submitMsg}</div>}

              <button
                className="rounded-xl border border-[var(--accent-35a)] bg-[var(--btn-primary-bg)] text-[var(--text-strong)] font-bold px-4 py-2 hover:shadow-[var(--hover-shadow)]"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Posting…" : "Post Comment"}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
