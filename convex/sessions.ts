import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeServerKey(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function assertServerKey(serverKey: string) {
  const expectedKey =
    normalizeServerKey(process.env.SESSIONS_SERVER_KEY) ||
    normalizeServerKey(process.env.PARTICIPANTS_SERVER_KEY);
  const providedKey = normalizeServerKey(serverKey);

  if (!expectedKey) {
    throw new Error("Server key not configured");
  }

  if (providedKey !== expectedKey) {
    throw new Error("Forbidden");
  }
}

async function getUserByDiscordIdOrThrow(
  ctx: MutationCtx | QueryCtx,
  discordId: string,
) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_discordId", (q) => q.eq("discordId", discordId))
    .unique();

  if (!user) {
    throw new Error("User not found. Refresh the dashboard and try again.");
  }

  return user;
}

async function getSessionById(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
) {
  return ctx.db.get(sessionId);
}

async function getSessionByIdOrThrow(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
) {
  const session = await getSessionById(ctx, sessionId);

  if (!session) {
    throw new Error("Session not found.");
  }

  return session;
}

export const createSessionServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    bookTitle: v.string(),
    authorName: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const bookTitle = args.bookTitle.trim();

    if (!bookTitle) {
      throw new Error("Book title is required.");
    }

    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);

    const sessionId = await ctx.db.insert("sessions", {
      bookTitle,
      authorName: normalizeOptional(args.authorName),
      title: normalizeOptional(args.title),
      synopsis: normalizeOptional(args.synopsis),
      createdBy: user._id,
      createdAt: Date.now(),
      status: "active",
    });

    return sessionId;
  },
});

export const listMySessionsServer = query({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);

    return ctx.db
      .query("sessions")
      .withIndex("by_createdBy_createdAt", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .collect();
  },
});

export const endSessionServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    if (session.createdBy !== user._id) {
      throw new Error("You can only end your own session.");
    }

    if (session.status === "ended") {
      return args.sessionId;
    }

    await ctx.db.patch(args.sessionId, {
      status: "ended",
      endedAt: Date.now(),
    });

    return args.sessionId;
  },
});

export const getSessionByIdServer = query({
  args: {
    serverKey: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);

    const session = await getSessionById(ctx, args.sessionId);

    if (!session) {
      return null;
    }

    const host = await ctx.db.get(session.createdBy);

    return {
      session,
      hostName: host?.name,
      hostImage: host?.image,
    };
  },
});

export const joinSessionServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    const existing = await ctx.db
      .query("participants")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", user._id),
      )
      .unique();

    if (existing) {
      return existing;
    }

    const participantId = await ctx.db.insert("participants", {
      sessionId: args.sessionId,
      userId: user._id,
      role: session.createdBy === user._id ? "host" : "reader",
      joinedAt: Date.now(),
    });

    const participant = await ctx.db.get(participantId);

    if (!participant) {
      throw new Error("Failed to create participant.");
    }

    return participant;
  },
});

export const ensureHostParticipantOnCreateServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    const existing = await ctx.db
      .query("participants")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", user._id),
      )
      .unique();

    if (existing) {
      if (existing.role !== "host" && session.createdBy === user._id) {
        await ctx.db.patch(existing._id, { role: "host" });
      }

      return existing._id;
    }

    if (session.createdBy !== user._id) {
      throw new Error("Only the session creator can be host.");
    }

    return ctx.db.insert("participants", {
      sessionId: args.sessionId,
      userId: user._id,
      role: "host",
      joinedAt: session.createdAt,
    });
  },
});

export const listParticipantsServer = query({
  args: {
    serverKey: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    await getSessionByIdOrThrow(ctx, args.sessionId);

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const usersById = new Map(
      (
        await Promise.all(
          participants.map(async (participant) => {
            const user = await ctx.db.get(participant.userId);
            return [participant.userId, user] as const;
          }),
        )
      ).filter(([, user]) => Boolean(user)),
    );

    return participants
      .map((participant) => {
        const user = usersById.get(participant.userId);

        if (!user) {
          return null;
        }

        return {
          userId: participant.userId,
          name: user.name,
          image: user.image,
          role: participant.role,
          joinedAt: participant.joinedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        if (a.role !== b.role) {
          return a.role === "host" ? -1 : 1;
        }

        return a.joinedAt - b.joinedAt;
      });
  },
});

export const isParticipantServer = query({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    await getSessionByIdOrThrow(ctx, args.sessionId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_discordId", (q) => q.eq("discordId", args.discordId))
      .unique();

    if (!user) {
      return false;
    }

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", user._id),
      )
      .unique();

    return Boolean(participant);
  },
});

// Deprecated insecure endpoints kept only to fail closed if called directly.
export const createSession = mutation({
  args: {},
  handler: async () => {
    throw new Error("Deprecated insecure endpoint. Use createSessionServer.");
  },
});

export const listMySessions = query({
  args: {},
  handler: async () => {
    throw new Error("Deprecated insecure endpoint. Use listMySessionsServer.");
  },
});

export const endSession = mutation({
  args: {},
  handler: async () => {
    throw new Error("Deprecated insecure endpoint. Use endSessionServer.");
  },
});
