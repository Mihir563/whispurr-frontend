"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const MOODS = [
  "happy",
  "sad",
  "angry",
  "excited",
  "anxious",
  "calm",
  "thoughtful",
  "confused",
  "motivated",
  "neutral",
] as const;

type Mood = typeof MOODS[number];

const Create: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood>("neutral");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
    []
  );
  const UPLOAD_URL = useMemo(
    () => process.env.NEXT_PUBLIC_UPLOAD_IMAGE_URL || "https://veovfplmlcnmgzgtevfx.supabase.co/functions/v1/upload-image",
    []
  );

  useEffect(() => {
    // Try common token keys
    const knownToken =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      "";
    if (knownToken) setToken(knownToken);
  }, []);

  const uploadToSupabase = async (file: File): Promise<{ url: string; path: string }> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Image upload failed");
    }
    const data = await res.json().catch(() => ({}));
    if (!data?.url || !data?.path) {
      throw new Error("Invalid upload response");
    }
    return { url: data.url as string, path: data.path as string };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Missing token. Please paste your JWT below.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setSubmitting(true);
      let uploaded: { url: string; path: string } | null = null;
      if (imageFile) {
        setUploadingImage(true);
        uploaded = await uploadToSupabase(imageFile);
        setUploadingImage(false);
      }
      await axios.post(
        `${API_BASE}/posts/create`,
        {
          title,
          content,
          mood,
          isAnonymous,
          imageUrl: uploaded?.url,
          imagePath: uploaded?.path,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Whispurr created successfully ✨");
      setTitle("");
      setContent("");
      setMood("neutral");
      setIsAnonymous(true);
      setImageFile(null);
      setImagePreview(null);
      // @ts-expect-error : ignore
    } catch (err: Error) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Something went wrong";
      setError(`Failed to create whispurr: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="relative min-h-screen grid place-items-center bg-[var(--page-bg)] text-[var(--text)] p-5">
      <div className="fixed -inset-x-[10vw] -top-[20vh] h-[60vh] bg-[radial-gradient(ellipse_at_center,var(--accent-16a),transparent_60%)] blur-[40px] pointer-events-none z-0" />
      <div className="relative z-10 w-full max-w-[820px] rounded-[18px] p-7 bg-[var(--panel-bg)] border border-[var(--panel-border)] shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-[var(--panel-blur)]">
        <header className="text-center mb-4.5">
          <div className="inline-block px-2.5 py-1 rounded-full text-[12px] tracking-[0.08em] uppercase text-[var(--link)] border border-[var(--accent-35a)] bg-[radial-gradient(80%_120%_at_50%_0%,var(--accent-16a),rgba(0,0,0,0.2))]">Whispurr</div>
          <h1 className="mt-2 mb-1.5 text-[28px] font-bold text-[var(--text-strong)]">Create a Whispurr</h1>
          <p className="m-0 text-sm text-[var(--text-muted)]">Share thoughts in style — sleek, secure, and anonymous by default.</p>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-[13px] text-[var(--text-muted)]" htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              className="w-full text-[var(--text)] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] px-3.5 py-3 outline-none placeholder-[#87a3a9] focus:border-[var(--accent-35a)] focus:shadow-[var(--focus-ring)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A whispering headline..."
              maxLength={120}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-[13px] text-[var(--text-muted)]" htmlFor="content">Content</label>
            <textarea
              id="content"
              className="w-full text-[var(--text)] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] px-3.5 py-3 outline-none placeholder-[#87a3a9] focus:border-[var(--accent-35a)] focus:shadow-[var(--focus-ring)] resize-y"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Let your thoughts flow..."
            />
          </div>

          <div className="grid gap-2">
            <label className="text-[13px] text-[var(--text-muted)]" htmlFor="image">Image (optional)</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              className="w-full text-[var(--text)] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                setImagePreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            {imagePreview && (
              <div className="mt-2">
                <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                </div>
                <button
                  type="button"
                  className="mt-2 text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--accent-35a)]"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                >
                  Remove image
                </button>
              </div>
            )}
            {uploadingImage && <div className="text-xs text-[var(--text-muted)]">Uploading image…</div>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-[13px] text-[var(--text-muted)]" htmlFor="mood">Mood</label>
              <div className="relative">
                <select
                  id="mood"
                  className="w-full appearance-none cursor-pointer text-[var(--text)] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] px-3.5 py-3 pr-9 outline-none focus:border-[var(--accent-35a)] focus:shadow-[var(--focus-ring)]"
                  value={mood}
                  onChange={(e) => setMood(e.target.value as Mood)}
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--link)]">▾</span>
                <span className="absolute inset-[1px] rounded-[11px] bg-[var(--panel-gloss)] pointer-events-none" />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-[13px] text-[var(--text-muted)]">Anonymous</label>
              <button
                type="button"
                className={`relative inline-flex items-center gap-2 w-[84px] h-11 p-1 rounded-full border border-[var(--border)] bg-[var(--input-bg)] ${isAnonymous ? "shadow-[inset_0_0_0_1px_rgba(0,255,200,0.3)]" : ""}`}
                onClick={() => setIsAnonymous((v) => !v)}
                aria-pressed={isAnonymous}
              >
                <span
                  className={`absolute left-1 top-1 w-[34px] h-[34px] rounded-full shadow-[0_6px_18px_rgba(0,255,200,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform duration-200 ease-out bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),rgba(200,255,245,0.2)_40%,rgba(0,0,0,0.2)_60%),linear-gradient(180deg,rgba(120,255,230,0.4),rgba(0,0,0,0.2))] ${isAnonymous ? "translate-x-0" : "translate-x-[36px]"}`}
                />
                <span className="ml-auto mr-2 text-[13px] text-[var(--link)]">{isAnonymous ? "On" : "Off"}</span>
              </button>
            </div>
          </div>

          {error && <div className="px-3 py-2.5 rounded-xl text-sm bg-[rgba(255,64,64,0.12)] border border-[rgba(255,99,99,0.3)] text-[#ffd7d7]">{error}</div>}
          {message && <div className="px-3 py-2.5 rounded-xl text-sm bg-[rgba(0,255,200,0.12)] border border-[var(--accent-35a)] text-[#bafff1]">{message}</div>}

          <div className="flex justify-end">
            <button className="rounded-xl border border-[var(--accent-35a)] bg-[var(--btn-primary-bg)] text-[var(--text-strong)] font-semibold px-4 py-3 hover:shadow-[var(--hover-shadow)] disabled:opacity-70" disabled={submitting} type="submit">
              {submitting ? "Whispering..." : "Create Whispurr"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Create;
