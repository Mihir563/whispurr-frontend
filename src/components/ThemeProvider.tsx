"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Mode =
  | "dark"
  | "light"
  | "ocean"
  | "violet"
  | "forest"
  | "sunset"
  | "solar";

type ThemeContextType = {
  theme: Mode;
  setTheme: (mode: Mode) => void;
  toggle: () => void; // cycles to next theme
  themes: Mode[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES: Mode[] = [
  "dark",
  "light",
  "ocean",
  "violet",
  "forest",
  "sunset",
  "solar",
];

function getPreferred(): Mode {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("theme") as Mode | null;
  if (saved && (THEMES as string[]).includes(saved)) return saved;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }>
= ({ children }) => {
  // Start with a stable theme for SSR and first client render to avoid hydration mismatches.
  const [theme, setTheme] = useState<Mode>("dark");

  // After mount, read preferred theme (localStorage or system) and apply.
  useEffect(() => {
    setTheme(getPreferred());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const saved = localStorage.getItem("theme") as Mode | null;
      if (!saved) setTheme(mq.matches ? "dark" : "light");
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    setTheme: (m) => setTheme(m),
    toggle: () => setTheme(prev => {
      const i = THEMES.indexOf(prev);
      const next = THEMES[(i + 1) % THEMES.length];
      return next;
    }),
    themes: THEMES,
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
