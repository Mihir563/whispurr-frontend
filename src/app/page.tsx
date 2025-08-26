'use client'

import React, { useEffect, useMemo, useState } from "react";
// Note: use fetch here to avoid axios interceptor adding Authorization
import Link from "next/link";

type Post = {
  _id?: string;
  id?: string;
  title?: string;
  content?: string;
  mood?: string;
  isAnonymous?: boolean;
  postedBy?: { username?: string } | string | null;
  createdAt?: string;
  reactions?: any;
  comments?: any[] | number;
  commentsCount?: number;
  imageUrl?: string | null;
  imagePath?: string | null;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
    []
  );

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setError(null);
        setLoading(true);
        const token = localStorage.getItem("token");
        const uname = localStorage.getItem("username");
        setAuthed(!!token);
        setUsername(uname);
        setAuthChecked(true);
        const res = await fetch(`${API_BASE}/posts/all`, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Failed to load posts");
        }
        const data = await res.json();
        const items: Post[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.posts)
          ? data.posts
          : [];
        setPosts(items);
      } catch (err: any) {
        const msg = err?.message || "Failed to load posts";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [API_BASE]);

  const displayName = (p: Post) => {
    if (p.isAnonymous) return "Anonymous";
    if (p.postedBy && typeof p.postedBy === "object" && p.postedBy.username)
      return p.postedBy.username as string;
    if (typeof p.postedBy === "string") return p.postedBy;
    return "User";
  };

  const initial = (name: string) => (name?.[0] || "A").toUpperCase();
  const dateStr = (p: Post) => (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "");

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--page-bg)] text-[var(--text)] px-6 pb-12 pt-4 grid grid-rows-[auto,1fr] gap-8">
      {/* Hero */}
      <div className="relative text-center py-8">
        <div className="absolute -inset-x-0 -top-[20%] bottom-0 bg-[radial-gradient(ellipse_at_50%_0%,var(--accent-16a),transparent_60%)] blur-[36px] z-0" />
        <h1 className="relative z-10 text-5xl font-black tracking-[0.4px] mb-3 bg-clip-text text-transparent bg-[linear-gradient(180deg,var(--text-strong),var(--text))]">Whispurr</h1>
        <p className="relative z-10 text-[var(--text-muted)] mb-5 max-w-2xl mx-auto">Share what matters. Quietly. Beautifully.</p>
        <div className="relative z-10 inline-flex flex-wrap justify-center gap-3">
          <a href="/create" className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-35a)] bg-[var(--btn-primary-bg)] text-[var(--text-strong)] font-bold px-5 py-3 hover:shadow-[var(--hover-shadow)]">Create Whispurr</a>
          {authChecked && !authed && (
            <>
              <a href="/login" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text-strong)] font-bold px-5 py-3 hover:border-[var(--accent-35a)] hover:shadow-[var(--hover-shadow)]">Login</a>
              <a href="/signup" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text-strong)] font-bold px-5 py-3 hover:border-[var(--accent-35a)] hover:shadow-[var(--hover-shadow)]">Sign Up</a>
            </>
          )}
          {authChecked && authed && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] text-[var(--text-muted)] px-4 py-3">Welcome{username ? `, ${username}` : ''} 👋</span>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="m-0 text-xl font-semibold text-[var(--text-strong)]">Latest Posts</h2>
          <span className="text-[var(--text-muted)] text-sm">{loading ? "Loading..." : `${posts.length} posts`}</span>
        </div>

        {error && (
          <div className="my-3 p-3 border rounded-xl text-[#ff6b6b] bg-[rgba(255,107,107,0.08)] border-[var(--border)]">{error}</div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="mt-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-8 text-center text-[var(--text-muted)]">
            No posts yet. Be the first to <a href="/create" className="underline text-[var(--text-strong)]">create one</a>.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && !error && (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[200px] rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.06),rgba(255,255,255,0.02))] animate-pulse" />
            ))
          )}

          {!loading && !error && posts.map((p) => {
            const name = displayName(p);
            return (
              <Link href={`/post/${p._id || p.id}`} className="block group" key={p._id || p.id}>
                <article className="relative overflow-hidden rounded-2xl p-5 border bg-[var(--panel-bg)] border-[var(--panel-border)] transition duration-200 ease-linear group-hover:-translate-y-0.5 group-hover:shadow-[var(--hover-shadow)] group-hover:border-[var(--accent-35a)]">
                  <header className="grid grid-cols-[auto,1fr,auto] gap-3 items-center">
                    <div className="flex items-center-2">
                    <div className="w-10 h-10 rounded-full grid place-items-center font-extrabold text-[var(--text-strong)] bg-[radial-gradient(circle_at_30%_30%,var(--accent-16a),transparent_60%),var(--btn-bg)] border border-[var(--border)] shadow-[var(--hover-shadow)]" aria-hidden>
                      {initial(name)}
                    </div>
                    <div className="leading-tight px-2">
                      <div className="font-bold text-[var(--text-strong)]">{name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{dateStr(p)}</div>
                    </div>
                    </div>
                    {p.mood ? <span className="text-xs justify-end px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)]">{p.mood}</span> : null}
                  </header>
                  {p.imageUrl ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title || "Post image"} className="w-full h-44 object-cover" />
                    </div>
                  ) : null}
                  {p.title ? <h3 className="mt-3 mb-2 text-lg font-semibold text-[var(--text-strong)]">{p.title}</h3> : null}
                  {p.content ? (
                    <p
                      className="m-0 text-[var(--text)] opacity-95 overflow-hidden"
                      style={{ display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" }}
                    >
                      {p.content}
                    </p>
                  ) : null}
                  <footer className="flex gap-2.5 items-center mt-4">
                    <div className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] bg-transparent">❤ {p?.reactions?.likes ?? 0}</div>
                    <div className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] bg-transparent">💬 {typeof p?.commentsCount === 'number' ? p.commentsCount : (Array.isArray(p?.comments) ? p.comments.length : (typeof p?.comments === 'number' ? p.comments : 0))}</div>
                  </footer>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
