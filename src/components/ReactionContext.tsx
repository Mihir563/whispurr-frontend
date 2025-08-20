"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import axios from "axios";

export type ReactionSummary = Record<string, number>;

export type ReactResponse = {
  reactionSummary: ReactionSummary;
  currentUserReaction: string | null;
  likesCount?: number;
  dislikesCount?: number;
};

export type ReactionAPI = {
  react: (commentId: string, emoji: string) => Promise<ReactResponse>;
  pending: Record<string, boolean>;
};

const ReactionContext = createContext<ReactionAPI | null>(null);

export const useReactions = () => {
  const ctx = useContext(ReactionContext);
  if (!ctx) throw new Error("useReactions must be used within ReactionProvider");
  return ctx;
};

export const ReactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const API_BASE = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
    []
  );

  const react = useCallback(async (commentId: string, emoji: string): Promise<ReactResponse> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setPending((p) => ({ ...p, [commentId]: true }));
    try {
      const { data } = await axios.post(
        `${API_BASE}/comments/${commentId}/react-emoji`,
        { emoji },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return {
        reactionSummary: data?.reactionSummary || {},
        currentUserReaction: data?.currentUserReaction ?? null,
        likesCount: data?.likesCount,
        dislikesCount: data?.dislikesCount,
      };
    } finally {
      setPending((p) => {
        const cp = { ...p };
        delete cp[commentId];
        return cp;
      });
    }
  }, [API_BASE]);

  const value = useMemo(() => ({ react, pending }), [react, pending]);

  return (
    <ReactionContext.Provider value={value}>{children}</ReactionContext.Provider>
  );
};
