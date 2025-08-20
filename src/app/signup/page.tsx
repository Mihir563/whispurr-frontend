"use client";
import React, { useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();
  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/auth/register`, { username, email, password });
      const { token, refreshToken, userId, username: respUsername, message: respMessage } = res.data || {};

      if (respMessage) setMessage(respMessage);
      if (!token || !userId) {
        // Some backends may not issue tokens directly on register, but your spec says they do.
        // If they don't, you can redirect to login instead.
        setMessage((prev) => prev || "Registered successfully. Redirecting to login...");
        setTimeout(() => router.push("/login"), 1200);
        return;
      }

      // Save auth locally
      localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", respUsername || username);

      setMessage((prev) => prev || "Registered successfully. Redirecting...");
      setTimeout(() => router.push("/"), 900);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Signup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--page-bg)] text-[var(--text)] p-5">
      <div className="w-full max-w-[520px] rounded-2xl p-7 bg-[var(--panel-bg)] border border-[var(--panel-border)] backdrop-blur-[var(--panel-blur)] shadow-[0_18px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <h1 className="m-0 mb-1.5 text-[26px] font-extrabold text-[var(--text-strong)]">Join Whispurr</h1>
        <p className="m-0 mb-4 text-sm text-[var(--text-muted)]">Create your account to start whispering.</p>

        <form className="grid gap-3.5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label htmlFor="username" className="text-[13px] text-[var(--text-muted)]">Username</label>
            <input
              id="username"
              type="text"
              className="w-full text-[var(--text)] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] px-3.5 py-3 outline-none focus:border-[var(--accent-35a)] focus:shadow-[var(--focus-ring)]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. mihir"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="email" className="text-[13px] text-[var(--text-muted)]">Email</label>
            <input
              id="email"
              type="email"
              className="w-full text-[var(--text)] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] px-3.5 py-3 outline-none focus:border-[var(--accent-35a)] focus:shadow-[var(--focus-ring)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="password" className="text-[13px] text-[var(--text-muted)]">Password</label>
            <input
              id="password"
              type="password"
              className="w-full text-[var(--text)] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] px-3.5 py-3 outline-none focus:border-[var(--accent-35a)] focus:shadow-[var(--focus-ring)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="px-3 py-2.5 rounded-xl text-sm bg-[rgba(255,64,64,0.12)] border border-[rgba(255,99,99,0.3)] text-[#ffd7d7]">{error}</div>}
          {message && <div className="px-3 py-2.5 rounded-xl text-sm bg-[rgba(0,255,200,0.12)] border border-[var(--accent-35a)] text-[#bafff1]">{message}</div>}

          <button disabled={loading} className="rounded-xl border border-[var(--accent-35a)] bg-[var(--btn-primary-bg)] text-[var(--text-strong)] font-bold px-4 py-3 hover:shadow-[var(--hover-shadow)] disabled:opacity-70" type="submit">
            {loading ? "Signing up..." : "Create account"}
          </button>
        </form>

        <p className="mt-3.5 text-[var(--text-muted)]">
          Already have an account? <Link href="/login" className="text-[var(--link)]">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
