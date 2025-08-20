"use client";
import React, { useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { token, refreshToken, userId, username } = res.data || {};
      if (!token || !userId) throw new Error("Invalid response from server");

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken || "");
      localStorage.setItem("userId", userId);
      if (username) localStorage.setItem("username", username);

      router.push("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--page-bg)] text-[var(--text)] p-5">
      <div className="w-full max-w-[480px] rounded-2xl p-7 bg-[var(--panel-bg)] border border-[var(--panel-border)] backdrop-blur-[var(--panel-blur)] shadow-[0_18px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <h1 className="m-0 mb-1.5 text-[26px] font-extrabold text-[var(--text-strong)]">Welcome back</h1>
        <p className="m-0 mb-4 text-sm text-[var(--text-muted)]">Login to continue your Whispurr.</p>

        <form className="grid gap-3.5" onSubmit={handleSubmit}>
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

          <button disabled={loading} className="rounded-xl border border-[var(--accent-35a)] bg-[var(--btn-primary-bg)] text-[var(--text-strong)] font-bold px-4 py-3 hover:shadow-[var(--hover-shadow)] disabled:opacity-70" type="submit">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-3.5 text-[var(--text-muted)]">
          Don&apos;t have an account? <Link href="/signup" className="text-[var(--link)]">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
