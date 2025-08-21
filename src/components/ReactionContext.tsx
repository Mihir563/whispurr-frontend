"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api } from "@/lib/api";

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

  const react = useCallback(async (commentId: string, emoji: string): Promise<ReactResponse> => {
    setPending((p) => ({ ...p, [commentId]: true }));
    try {
      const { data } = await api.post(`/comments/${commentId}/react-emoji`, { emoji });
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
  }, []);

  const value = useMemo(() => ({ react, pending }), [react, pending]);

  return (
    <ReactionContext.Provider value={value}>{children}</ReactionContext.Provider>
  );
};
