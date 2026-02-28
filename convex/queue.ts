import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

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
    normalizeServerKey(process.env.PARTICIPANTS_SERVER_KEY) ||
    normalizeServerKey(process.env.QUEUE_SERVER_KEY);
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

function assertSessionActive(session: { status: "active" | "ended" }) {
  if (session.status === "ended") {
    throw new Error("Session has ended.");
  }
}

async function getParticipantBySessionAndUser(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  userId: Id<"users">,
) {
  return ctx.db
    .query("participants")
    .withIndex("by_sessionId_userId", (q) =>
      q.eq("sessionId", sessionId).eq("userId", userId),
    )
    .unique();
}

async function getParticipantBySessionAndUserOrThrow(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  userId: Id<"users">,
) {
  const participant = await getParticipantBySessionAndUser(ctx, sessionId, userId);

  if (!participant) {
    throw new Error("Join session first.");
  }

  return participant;
}

async function getQueueItemsByPosition(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
) {
  return ctx.db
    .query("queueItems")
    .withIndex("by_sessionId_position", (q) => q.eq("sessionId", sessionId))
    .order("asc")
    .collect();
}

async function setNextReader(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  minPositionExclusive = -1,
) {
  const queue = await getQueueItemsByPosition(ctx, sessionId);
  const nextReader =
    queue.find(
      (item) => item.status === "waiting" && item.position > minPositionExclusive,
    ) ?? queue.find((item) => item.status === "waiting");

  if (!nextReader) {
    return null;
  }

  await ctx.db.patch(nextReader._id, {
    status: "reading",
  });

  return nextReader._id;
}

async function clearExtraReaders(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
) {
  const queue = await getQueueItemsByPosition(ctx, sessionId);
  const readingItems = queue.filter((item) => item.status === "reading");

  if (readingItems.length <= 1) {
    return;
  }

  for (let index = 1; index < readingItems.length; index += 1) {
    await ctx.db.patch(readingItems[index]._id, {
      status: "waiting",
    });
  }
}

async function normalizeQueuePositions(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
) {
  const queue = await getQueueItemsByPosition(ctx, sessionId);

  for (let index = 0; index < queue.length; index += 1) {
    const expectedPosition = index + 1;

    if (queue[index].position !== expectedPosition) {
      await ctx.db.patch(queue[index]._id, {
        position: expectedPosition,
      });
    }
  }
}

export const joinQueueServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);
    await getParticipantBySessionAndUserOrThrow(ctx, args.sessionId, user._id);

    const existing = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", user._id),
      )
      .unique();

    if (existing) {
      return existing;
    }

    const queue = await getQueueItemsByPosition(ctx, args.sessionId);
    const hasActiveReaderOrWaiting = queue.some(
      (item) => item.status === "reading" || item.status === "waiting",
    );

    const insertedId = await ctx.db.insert("queueItems", {
      sessionId: args.sessionId,
      userId: user._id,
      position: queue.length > 0 ? queue[queue.length - 1].position + 1 : 1,
      status: hasActiveReaderOrWaiting ? "waiting" : "reading",
      joinedAt: Date.now(),
    });

    const inserted = await ctx.db.get(insertedId);

    if (!inserted) {
      throw new Error("Failed to create queue entry.");
    }

    return inserted;
  },
});

export const leaveQueueServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);

    const existing = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", user._id),
      )
      .unique();

    if (!existing) {
      return null;
    }

    const wasReader = existing.status === "reading";
    await ctx.db.delete(existing._id);
    await normalizeQueuePositions(ctx, args.sessionId);

    if (wasReader) {
      await setNextReader(ctx, args.sessionId);
    }

    await clearExtraReaders(ctx, args.sessionId);

    return existing._id;
  },
});

export const skipMyTurnServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);

    const existing = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", user._id),
      )
      .unique();

    if (!existing) {
      throw new Error("Queue entry not found.");
    }

    if (existing.status !== "reading") {
      throw new Error("Only current reader can skip turn.");
    }

    await ctx.db.patch(existing._id, {
      status: "done",
    });

    await setNextReader(ctx, args.sessionId, existing.position);
    await clearExtraReaders(ctx, args.sessionId);

    return existing._id;
  },
});

export const advanceQueueServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);

    const participant = await getParticipantBySessionAndUserOrThrow(
      ctx,
      args.sessionId,
      user._id,
    );

    if (participant.role !== "host") {
      throw new Error("Only host can advance queue.");
    }

    const queue = await getQueueItemsByPosition(ctx, args.sessionId);
    const currentReader = queue.find((item) => item.status === "reading");

    if (!currentReader) {
      const nextReader = await setNextReader(ctx, args.sessionId);
      await clearExtraReaders(ctx, args.sessionId);
      return nextReader;
    }

    await ctx.db.patch(currentReader._id, {
      status: "done",
    });

    const nextReaderId = await setNextReader(
      ctx,
      args.sessionId,
      currentReader.position,
    );
    await clearExtraReaders(ctx, args.sessionId);

    return nextReaderId;
  },
});

export const getQueueServer = query({
  args: {
    serverKey: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    await getSessionByIdOrThrow(ctx, args.sessionId);

    const queue = await getQueueItemsByPosition(ctx, args.sessionId);
    const users = await Promise.all(
      queue.map(async (item) => {
        const user = await ctx.db.get(item.userId);
        return [item.userId, user] as const;
      }),
    );
    const usersById = new Map(users.filter(([, user]) => Boolean(user)));

    return queue.map((item) => {
      const user = usersById.get(item.userId);

      return {
        queueItemId: item._id,
        userId: item.userId,
        name: user?.name ?? "Unknown reader",
        image: user?.image,
        position: item.position,
        status: item.status,
        joinedAt: item.joinedAt,
      };
    });
  },
});
