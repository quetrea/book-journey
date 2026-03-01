import { v } from "convex/values";

import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  getAuthUserIdFromIdentity,
  getProfileByAuthUserId,
  requireIdentity,
  upsertViewerProfile,
} from "./lib/authProfile";

async function getSessionByIdOrThrow(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
) {
  const session = await ctx.db.get(sessionId);

  if (!session) {
    throw new Error("Session not found.");
  }

  return session;
}

async function getParticipantBySessionAndUser(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  userId: Id<"profiles">,
) {
  return ctx.db
    .query("participants")
    .withIndex("by_sessionId_userId", (q) =>
      q.eq("sessionId", sessionId).eq("userId", userId),
    )
    .unique();
}

export const addWordServer = mutation({
  args: {
    sessionId: v.id("sessions"),
    word: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    if (session.status === "ended") {
      throw new Error("Session has ended.");
    }

    const trimmedWord = args.word.trim();

    if (!trimmedWord) {
      throw new Error("Word cannot be empty.");
    }

    const viewer = await upsertViewerProfile(ctx);
    const participant = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      viewer._id,
    );

    if (!participant) {
      throw new Error("Join the session first.");
    }

    return ctx.db.insert("sessionWords", {
      sessionId: args.sessionId,
      userId: viewer._id,
      word: trimmedWord,
      context: args.context?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});

export const removeWordServer = mutation({
  args: {
    wordId: v.id("sessionWords"),
  },
  handler: async (ctx, args) => {
    const wordEntry = await ctx.db.get(args.wordId);

    if (!wordEntry) {
      return null;
    }

    const viewer = await upsertViewerProfile(ctx);

    const participant = await getParticipantBySessionAndUser(
      ctx,
      wordEntry.sessionId,
      viewer._id,
    );

    const isHost = participant?.role === "host";
    const isOwner = wordEntry.userId === viewer._id;

    if (!isHost && !isOwner) {
      throw new Error("You can only remove your own words.");
    }

    await ctx.db.delete(args.wordId);

    return args.wordId;
  },
});

export const listWordsServer = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const authUserId = getAuthUserIdFromIdentity(identity);
    const viewer = await getProfileByAuthUserId(ctx, authUserId);

    if (!viewer) {
      return [];
    }

    const words = await ctx.db
      .query("sessionWords")
      .withIndex("by_sessionId_createdAt", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .order("desc")
      .collect();

    const userIds = [...new Set(words.map((w) => w.userId))];
    const profiles = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const profilesById = new Map(
      profiles
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [p._id, p]),
    );

    return words.map((w) => {
      const profile = profilesById.get(w.userId);

      return {
        _id: w._id,
        word: w.word,
        context: w.context,
        userId: w.userId,
        userName: profile?.displayName ?? profile?.name ?? "Unknown",
        userImage: profile?.image,
        createdAt: w.createdAt,
      };
    });
  },
});
