import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getAuthUserIdFromIdentity,
  getProfileByAuthUserId,
  requireIdentity,
  upsertViewerProfile,
} from "./lib/authProfile";
import { hasActivePasscodeGrant } from "./lib/passcodeAccess";

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
  userId: Id<"profiles">,
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
  userId: Id<"profiles">,
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

  if (readingItems.length === 0) {
    const nextWaiting = queue.find((item) => item.status === "waiting");

    if (nextWaiting) {
      await ctx.db.patch(nextWaiting._id, {
        status: "reading",
      });
    }

    return;
  }

  if (readingItems.length === 1) {
    return;
  }

  for (let index = 1; index < readingItems.length; index += 1) {
    await ctx.db.patch(readingItems[index]._id, {
      status: "waiting",
    });
  }
}

async function resetQueueForRepeat(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
) {
  const queue = await getQueueItemsByPosition(ctx, sessionId);

  for (const item of queue) {
    if (item.status === "done") {
      await ctx.db.patch(item._id, { status: "waiting" });
    }
  }
}

async function normalizeQueuePositions(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
) {
  const queue = await getQueueItemsByPosition(ctx, sessionId);

  for (let index = 0; index < queue.length; index += 1) {
    const expectedPosition = index;

    if (queue[index].position !== expectedPosition) {
      await ctx.db.patch(queue[index]._id, {
        position: expectedPosition,
      });
    }
  }
}

async function assertPasscodeGrantForQueueMutation(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  sessionCreatedBy: Id<"profiles">,
  viewerId: Id<"profiles">,
) {
  if (viewerId === sessionCreatedBy) {
    return;
  }

  const hasGrant = await hasActivePasscodeGrant(ctx, sessionId, viewerId);

  if (!hasGrant) {
    throw new Error("Passcode verification required.");
  }
}

async function getViewerProfileForQuery(ctx: QueryCtx) {
  const identity = await requireIdentity(ctx);
  const authUserId = getAuthUserIdFromIdentity(identity);
  return getProfileByAuthUserId(ctx, authUserId);
}

export const joinQueueServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);

    const viewer = await upsertViewerProfile(ctx);
    await getParticipantBySessionAndUserOrThrow(ctx, args.sessionId, viewer._id);

    if (session.hostPasscode) {
      await assertPasscodeGrantForQueueMutation(
        ctx,
        args.sessionId,
        session.createdBy,
        viewer._id,
      );
    }

    await normalizeQueuePositions(ctx, args.sessionId);

    const existing = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", viewer._id),
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
      userId: viewer._id,
      position: queue.length > 0 ? queue[queue.length - 1].position + 1 : 0,
      status: hasActiveReaderOrWaiting ? "waiting" : "reading",
      joinedAt: Date.now(),
    });

    const inserted = await ctx.db.get(insertedId);

    if (!inserted) {
      throw new Error("Failed to create queue entry.");
    }

    await clearExtraReaders(ctx, args.sessionId);

    return inserted;
  },
});

export const leaveQueueServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);

    const viewer = await upsertViewerProfile(ctx);

    if (session.hostPasscode) {
      await assertPasscodeGrantForQueueMutation(
        ctx,
        args.sessionId,
        session.createdBy,
        viewer._id,
      );
    }

    const existing = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", viewer._id),
      )
      .unique();

    if (!existing) {
      return null;
    }

    const wasReader = existing.status === "reading";
    await ctx.db.delete(existing._id);
    await normalizeQueuePositions(ctx, args.sessionId);

    if (wasReader) {
      let nextReaderId = await setNextReader(ctx, args.sessionId);

      if (!nextReaderId && session.isRepeatEnabled) {
        await resetQueueForRepeat(ctx, args.sessionId);
        nextReaderId = await setNextReader(ctx, args.sessionId);
      }

      if (nextReaderId) {
        const nextItem = await ctx.db.get(nextReaderId);
        if (nextItem) {
          await ctx.scheduler.runAfter(0, internal.pushNotificationsAction.sendTurnNotification, {
            userId: nextItem.userId,
            bookTitle: session.bookTitle,
            sessionId: args.sessionId,
          });
        }
      }
    }

    await clearExtraReaders(ctx, args.sessionId);

    return existing._id;
  },
});

export const skipMyTurnServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);

    const viewer = await upsertViewerProfile(ctx);

    if (session.hostPasscode) {
      await assertPasscodeGrantForQueueMutation(
        ctx,
        args.sessionId,
        session.createdBy,
        viewer._id,
      );
    }

    const existing = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", viewer._id),
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

    let nextReaderId = await setNextReader(ctx, args.sessionId, existing.position);
    await normalizeQueuePositions(ctx, args.sessionId);
    await clearExtraReaders(ctx, args.sessionId);

    if (!nextReaderId && session.isRepeatEnabled) {
      await resetQueueForRepeat(ctx, args.sessionId);
      nextReaderId = await setNextReader(ctx, args.sessionId);
      await clearExtraReaders(ctx, args.sessionId);
    }

    if (nextReaderId) {
      const nextItem = await ctx.db.get(nextReaderId);
      if (nextItem) {
        await ctx.scheduler.runAfter(0, internal.pushNotificationsAction.sendTurnNotification, {
          userId: nextItem.userId,
          bookTitle: session.bookTitle,
          sessionId: args.sessionId,
        });
      }
    }

    return existing._id;
  },
});

export const advanceQueueServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);

    const viewer = await upsertViewerProfile(ctx);

    const participant = await getParticipantBySessionAndUserOrThrow(
      ctx,
      args.sessionId,
      viewer._id,
    );

    if (participant.role !== "host") {
      throw new Error("Only host can advance queue.");
    }

    const queue = await getQueueItemsByPosition(ctx, args.sessionId);
    const currentReader = queue.find((item) => item.status === "reading");

    if (!currentReader) {
      let nextReaderId = await setNextReader(ctx, args.sessionId);
      await normalizeQueuePositions(ctx, args.sessionId);
      await clearExtraReaders(ctx, args.sessionId);

      if (!nextReaderId && session.isRepeatEnabled) {
        await resetQueueForRepeat(ctx, args.sessionId);
        nextReaderId = await setNextReader(ctx, args.sessionId);
        await clearExtraReaders(ctx, args.sessionId);
      }

      if (nextReaderId) {
        const nextItem = await ctx.db.get(nextReaderId);
        if (nextItem) {
          await ctx.scheduler.runAfter(0, internal.pushNotificationsAction.sendTurnNotification, {
            userId: nextItem.userId,
            bookTitle: session.bookTitle,
            sessionId: args.sessionId,
          });
        }
      }

      return nextReaderId;
    }

    await ctx.db.patch(currentReader._id, {
      status: "done",
    });

    let nextReaderId = await setNextReader(
      ctx,
      args.sessionId,
      currentReader.position,
    );
    await normalizeQueuePositions(ctx, args.sessionId);
    await clearExtraReaders(ctx, args.sessionId);

    if (!nextReaderId && session.isRepeatEnabled) {
      await resetQueueForRepeat(ctx, args.sessionId);
      nextReaderId = await setNextReader(ctx, args.sessionId);
      await clearExtraReaders(ctx, args.sessionId);
    }

    if (nextReaderId) {
      const nextItem = await ctx.db.get(nextReaderId);
      if (nextItem) {
        await ctx.scheduler.runAfter(0, internal.pushNotificationsAction.sendTurnNotification, {
          userId: nextItem.userId,
          bookTitle: session.bookTitle,
          sessionId: args.sessionId,
        });
      }
    }

    return nextReaderId;
  },
});

export const addUserToQueueServer = mutation({
  args: {
    sessionId: v.id("sessions"),
    targetUserId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);

    const actor = await upsertViewerProfile(ctx);
    const actorParticipant = await getParticipantBySessionAndUserOrThrow(
      ctx,
      args.sessionId,
      actor._id,
    );

    if (actorParticipant.role !== "host") {
      throw new Error("Only host can add participants to queue.");
    }

    const targetParticipant = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      args.targetUserId,
    );

    if (!targetParticipant) {
      throw new Error("Target user is not a participant.");
    }

    await normalizeQueuePositions(ctx, args.sessionId);

    const existing = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", args.targetUserId),
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
      userId: args.targetUserId,
      position: queue.length > 0 ? queue[queue.length - 1].position + 1 : 0,
      status: hasActiveReaderOrWaiting ? "waiting" : "reading",
      joinedAt: Date.now(),
    });

    const inserted = await ctx.db.get(insertedId);

    if (!inserted) {
      throw new Error("Failed to create queue entry.");
    }

    await clearExtraReaders(ctx, args.sessionId);

    return inserted;
  },
});

export const removeFromQueueServer = mutation({
  args: {
    sessionId: v.id("sessions"),
    targetUserId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    assertSessionActive(session);

    const actor = await upsertViewerProfile(ctx);
    const actorParticipant = await getParticipantBySessionAndUserOrThrow(
      ctx,
      args.sessionId,
      actor._id,
    );

    if (actorParticipant.role !== "host") {
      throw new Error("Only host can remove participants from queue.");
    }

    const existing = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", args.targetUserId),
      )
      .unique();

    if (!existing) {
      return null;
    }

    const wasReader = existing.status === "reading";
    await ctx.db.delete(existing._id);
    await normalizeQueuePositions(ctx, args.sessionId);

    if (wasReader) {
      let nextReaderId = await setNextReader(ctx, args.sessionId);

      if (!nextReaderId && session.isRepeatEnabled) {
        await resetQueueForRepeat(ctx, args.sessionId);
        nextReaderId = await setNextReader(ctx, args.sessionId);
      }

      if (nextReaderId) {
        const nextItem = await ctx.db.get(nextReaderId);
        if (nextItem) {
          await ctx.scheduler.runAfter(0, internal.pushNotificationsAction.sendTurnNotification, {
            userId: nextItem.userId,
            bookTitle: session.bookTitle,
            sessionId: args.sessionId,
          });
        }
      }
    }

    await clearExtraReaders(ctx, args.sessionId);

    return existing._id;
  },
});

export const getQueueServer = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    await getViewerProfileForQuery(ctx);
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
