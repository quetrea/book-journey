import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import {
  getAuthUserIdFromIdentity,
  getProfileByAuthUserId,
  requireIdentity,
  upsertViewerProfile,
} from "./lib/authProfile";
import { grantPasscodeAccess, hasActivePasscodeGrant } from "./lib/passcodeAccess";

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizePasscode(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function hashPasscode(passcode: string) {
  let hash = 5381;

  for (let index = 0; index < passcode.length; index += 1) {
    hash = ((hash << 5) + hash) ^ passcode.charCodeAt(index);
  }

  const unsigned = hash >>> 0;
  return `v1_${unsigned.toString(16)}`;
}

function verifyPasscodeHash(passcode: string, hash: string) {
  return hashPasscode(passcode) === hash;
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

async function getQueueItemBySessionAndUser(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  userId: Id<"profiles">,
) {
  return ctx.db
    .query("queueItems")
    .withIndex("by_sessionId_userId", (q) =>
      q.eq("sessionId", sessionId).eq("userId", userId),
    )
    .unique();
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

async function normalizeQueuePositions(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
) {
  const queue = await getQueueItemsByPosition(ctx, sessionId);

  for (let index = 0; index < queue.length; index += 1) {
    if (queue[index].position !== index) {
      await ctx.db.patch(queue[index]._id, {
        position: index,
      });
    }
  }
}

async function ensureSingleReader(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
) {
  const queue = await getQueueItemsByPosition(ctx, sessionId);
  const readers = queue.filter((item) => item.status === "reading");

  if (readers.length === 0) {
    const nextWaiting = queue.find((item) => item.status === "waiting");

    if (nextWaiting) {
      await ctx.db.patch(nextWaiting._id, {
        status: "reading",
      });
    }

    return;
  }

  if (readers.length === 1) {
    return;
  }

  for (let index = 1; index < readers.length; index += 1) {
    await ctx.db.patch(readers[index]._id, {
      status: "waiting",
    });
  }
}

async function removeUserFromQueueForSession(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  userId: Id<"profiles">,
) {
  const queueItem = await getQueueItemBySessionAndUser(ctx, sessionId, userId);

  if (!queueItem) {
    return null;
  }

  await ctx.db.delete(queueItem._id);
  await normalizeQueuePositions(ctx, sessionId);
  await ensureSingleReader(ctx, sessionId);

  return queueItem._id;
}

function sanitizeSession(session: {
  _id: Id<"sessions">;
  _creationTime: number;
  bookTitle: string;
  authorName?: string;
  title?: string;
  synopsis?: string;
  createdBy: Id<"profiles">;
  createdAt: number;
  status: "active" | "ended";
  endedAt?: number;
  hostPasscode?: string;
  isRepeatEnabled?: boolean;
}) {
  const safeSession = { ...session };
  delete safeSession.hostPasscode;
  return safeSession;
}

async function getViewerProfileForQuery(ctx: QueryCtx) {
  const identity = await requireIdentity(ctx);
  const authUserId = getAuthUserIdFromIdentity(identity);
  return getProfileByAuthUserId(ctx, authUserId);
}

export const createSessionServer = mutation({
  args: {
    bookTitle: v.string(),
    authorName: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    hostPasscode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bookTitle = args.bookTitle.trim();

    if (!bookTitle) {
      throw new Error("Book title is required.");
    }

    const viewer = await upsertViewerProfile(ctx);
    const hostPasscode = normalizePasscode(args.hostPasscode);

    const sessionId = await ctx.db.insert("sessions", {
      bookTitle,
      authorName: normalizeOptional(args.authorName),
      title: normalizeOptional(args.title),
      synopsis: normalizeOptional(args.synopsis),
      hostPasscode: hostPasscode ? hashPasscode(hostPasscode) : undefined,
      createdBy: viewer._id,
      createdAt: Date.now(),
      status: "active",
    });

    await ctx.db.insert("participants", {
      sessionId,
      userId: viewer._id,
      role: "host",
      joinedAt: Date.now(),
    });

    return sessionId;
  },
});

export const listMySessionsServer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileForQuery(ctx);

    if (!viewer) {
      return [];
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_createdBy_createdAt", (q) => q.eq("createdBy", viewer._id))
      .order("desc")
      .collect();

    return Promise.all(
      sessions.map(async (session) => {
        const host = await ctx.db.get(session.createdBy);

        return {
          ...sanitizeSession(session),
          hostName: host?.name,
          hostImage: host?.image,
        };
      }),
    );
  },
});

export const endSessionServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    const participant = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      viewer._id,
    );

    if (!participant || participant.role !== "host") {
      throw new Error("Only host can end session.");
    }

    if (session.status === "ended") {
      return args.sessionId;
    }

    await ctx.db.patch(args.sessionId, {
      status: "ended",
      endedAt: Date.now(),
    });

    const queue = await getQueueItemsByPosition(ctx, args.sessionId);

    await Promise.all(
      queue.map((item) =>
        ctx.db.patch(item._id, {
          status: "done",
        }),
      ),
    );

    return args.sessionId;
  },
});

export const leaveSessionServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    const participant = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      viewer._id,
    );

    if (!participant) {
      return null;
    }

    if (participant.role === "host" && session.status === "active") {
      throw new Error("Host cannot leave an active session.");
    }

    await ctx.db.delete(participant._id);
    await removeUserFromQueueForSession(ctx, args.sessionId, viewer._id);

    return participant._id;
  },
});

export const getSessionByIdServer = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewerIdentity = await requireIdentity(ctx);
    const viewerAuthUserId = getAuthUserIdFromIdentity(viewerIdentity);
    const session = await getSessionById(ctx, args.sessionId);

    if (!session) {
      return null;
    }

    const host = await ctx.db.get(session.createdBy);
    const viewer = await getProfileByAuthUserId(ctx, viewerAuthUserId);
    const viewerParticipant = viewer
      ? await getParticipantBySessionAndUser(ctx, args.sessionId, viewer._id)
      : null;
    const isHost = viewerParticipant?.role === "host";
    const isPasscodeProtected = Boolean(session.hostPasscode);
    const hasPasscodeAccess =
      !isPasscodeProtected ||
      isHost ||
      Boolean(
        viewer &&
          (await hasActivePasscodeGrant(ctx, args.sessionId, viewer._id)),
      );

    return {
      session: sanitizeSession(session),
      hostName: host?.name,
      hostImage: host?.image,
      viewerUserId: viewer?._id,
      isHost,
      isPasscodeProtected,
      hasPasscodeAccess,
    };
  },
});

export const joinSessionServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    const existing = await ctx.db
      .query("participants")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", viewer._id),
      )
      .unique();

    if (existing) {
      return existing;
    }

    const participantId = await ctx.db.insert("participants", {
      sessionId: args.sessionId,
      userId: viewer._id,
      role: session.createdBy === viewer._id ? "host" : "reader",
      joinedAt: Date.now(),
    });

    const participant = await ctx.db.get(participantId);

    if (!participant) {
      throw new Error("Failed to create participant.");
    }

    return participant;
  },
});

export const listParticipantsServer = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
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
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileForQuery(ctx);
    await getSessionByIdOrThrow(ctx, args.sessionId);

    if (!viewer) {
      return false;
    }

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_sessionId_userId", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", viewer._id),
      )
      .unique();

    return Boolean(participant);
  },
});

export const verifySessionPasscodeServer = mutation({
  args: {
    sessionId: v.id("sessions"),
    passcode: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    const isHost = viewer._id === session.createdBy;

    if (!session.hostPasscode || isHost) {
      return {
        verified: true,
        isHost,
        isPasscodeProtected: Boolean(session.hostPasscode),
        hasPasscodeAccess: true,
      };
    }

    const normalizedPasscode = args.passcode.trim();

    if (!normalizedPasscode) {
      return {
        verified: false,
        isHost,
        isPasscodeProtected: true,
        hasPasscodeAccess: false,
      };
    }

    const verified = verifyPasscodeHash(normalizedPasscode, session.hostPasscode);

    if (verified) {
      await grantPasscodeAccess(ctx, args.sessionId, viewer._id);
    }

    return {
      verified,
      isHost,
      isPasscodeProtected: true,
      hasPasscodeAccess: verified,
    };
  },
});

export const toggleRepeatModeServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    const participant = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      viewer._id,
    );

    if (!participant || participant.role !== "host") {
      throw new Error("Only host can toggle repeat mode.");
    }

    if (session.status === "ended") {
      throw new Error("Session has ended.");
    }

    const newValue = !session.isRepeatEnabled;
    await ctx.db.patch(args.sessionId, { isRepeatEnabled: newValue });
    return newValue;
  },
});

export const listJoinedSessionsServer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileForQuery(ctx);

    if (!viewer) {
      return [];
    }

    const participations = await ctx.db
      .query("participants")
      .filter((q) => q.eq(q.field("userId"), viewer._id))
      .collect();

    const readerParticipations = participations.filter(
      (p) => p.role === "reader",
    );

    const sessions = await Promise.all(
      readerParticipations.map(async (p) => {
        const session = await ctx.db.get(p.sessionId);
        if (!session) return null;
        const host = await ctx.db.get(session.createdBy);
        return {
          ...sanitizeSession(session),
          hostName: host?.name,
          hostImage: host?.image,
          joinedAt: p.joinedAt,
        };
      }),
    );

    return sessions
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.joinedAt - a.joinedAt);
  },
});

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 50;

export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - RETENTION_MS;

    const expired = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "ended"),
          q.lte(q.field("endedAt"), cutoff),
        ),
      )
      .take(CLEANUP_BATCH_SIZE);

    for (const session of expired) {
      const participants = await ctx.db
        .query("participants")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const row of participants) {
        await ctx.db.delete(row._id);
      }

      const queueItems = await ctx.db
        .query("queueItems")
        .withIndex("by_sessionId_position", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const row of queueItems) {
        await ctx.db.delete(row._id);
      }

      const grants = await ctx.db
        .query("sessionPasscodeGrants")
        .withIndex("by_sessionId_userId", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const row of grants) {
        await ctx.db.delete(row._id);
      }

      await ctx.db.delete(session._id);
    }

    return { deleted: expired.length };
  },
});
