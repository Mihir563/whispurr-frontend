"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

 type Post = {
  _id: string;
  title?: string;
  content?: string;
  mood?: string;
  isAnonymous?: boolean;
  postedBy?: { username?: string } | string | null;
  createdAt?: string;
  commentsCount?: number;
};

const TABS = ["All", "Public", "Anonymous"] as const;

type TabKey = typeof TABS[number];

export default function ProfilePage() {
  const [tab, setTab] = useState<TabKey>("All");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // run only on client after hydration to avoid SSR mismatch
    try {
      setUsername(localStorage.getItem("username"));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const { data } = await api.get("/posts/mine");
        const items: Post[] = Array.isArray(data?.posts) ? data.posts : [];
        setPosts(items);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Failed to load your posts";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = posts.filter((p) => {
    if (tab === "All") return true;
    if (tab === "Public") return p.isAnonymous === false;
    if (tab === "Anonymous") return p.isAnonymous !== false;
    return true;
  });

  const displayName = (p: Post) => {
    if (p.isAnonymous) return "Anonymous";
    if (p.postedBy && typeof p.postedBy === "object" && p.postedBy.username)
      return p.postedBy.username as string;
    if (typeof p.postedBy === "string") return p.postedBy;
    return "User";
  };

  const initial = (name: string) => (name?.[0] || "A").toUpperCase();
  // Stable date string across server and client (UTC ISO slice)
  const dateStr = (p: Post) => (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : "");

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--page-bg)] text-[var(--text)] px-6 pb-12 pt-4 grid grid-rows-[auto,1fr] gap-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div>
            <h1 className="m-0 text-2xl font-bold text-[var(--text-strong)]">{username ? `${username}'s Profile` : "Your Profile"}</h1>
            <p className="m-0 text-[var(--text-muted)] text-sm">Your posts at a glance</p>
          </div>
          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--panel-bg)] p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm transition ${
                  tab === t
                    ? "bg-[var(--btn-primary-bg)] text-[var(--text-strong)] border border-[var(--accent-35a)]"
                    : "text-[var(--text)] hover:bg-[var(--input-bg)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 border rounded-xl text-[#ff6b6b] bg-[rgba(255,107,107,0.08)] border-[var(--border)]">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-8 text-center text-[var(--text-muted)]">
            No {tab === "All" ? "posts" : `${tab.toLowerCase()} posts`} yet.
            <div className="mt-3">
              <Link href="/create" className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-35a)] bg-[var(--btn-primary-bg)] text-[var(--text-strong)] font-bold px-4 py-2 hover:shadow-[var(--hover-shadow)]">
                Create your first post
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && !error && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[200px] rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.06),rgba(255,255,255,0.02))] animate-pulse" />
          ))}

          {!loading && !error && filtered.map((p) => {
            const name = displayName(p);
            return (
              <Link href={`/post/${p._id}`} className="block group" key={p._id}>
                <article className="relative overflow-hidden rounded-2xl p-5 border bg-[var(--panel-bg)] border-[var(--panel-border)] transition duration-200 ease-linear group-hover:-translate-y-0.5 group-hover:shadow-[var(--hover-shadow)] group-hover:border-[var(--accent-35a)]">
                  <header className="grid grid-cols-[auto,1fr,auto] gap-3 items-center">
                    <div className="w-10 h-10 rounded-full grid place-items-center font-extrabold text-[var(--text-strong)] bg-[radial-gradient(circle_at_30%_30%,var(--accent-16a),transparent_60%),var(--btn-bg)] border border-[var(--border)] shadow-[var(--hover-shadow)]" aria-hidden>
                      {initial(name)}
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-[var(--text-strong)]">{name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{dateStr(p)}</div>
                    </div>
                    {p.mood ? <span className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)]">{p.mood}</span> : null}
                  </header>
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
                    <div className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] bg-transparent">💬 {typeof p?.commentsCount === 'number' ? p.commentsCount : 0}</div>
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
