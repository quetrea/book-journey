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
import { assertHost, assertHostOrModerator } from "./lib/permissions";

type SessionAccessType = "public" | "passcode" | "private";
type JoinRequestStatus = "pending" | "approved" | "rejected";

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveSessionAccessType(session: {
  accessType?: SessionAccessType;
  isPrivate?: boolean;
  hostPasscode?: string;
}): SessionAccessType {
  if (session.accessType) {
    return session.accessType;
  }

  if (session.isPrivate) {
    return "private";
  }

  if (session.hostPasscode) {
    return "passcode";
  }

  return "public";
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

async function getJoinRequestBySessionAndRequester(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  requesterUserId: Id<"profiles">,
) {
  return ctx.db
    .query("sessionJoinRequests")
    .withIndex("by_sessionId_requesterUserId", (q) =>
      q.eq("sessionId", sessionId).eq("requesterUserId", requesterUserId),
    )
    .unique();
}

async function clearJoinRequestsForSession(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
) {
  const requests = await ctx.db
    .query("sessionJoinRequests")
    .withIndex("by_sessionId_status_requestedAt", (q) =>
      q.eq("sessionId", sessionId),
    )
    .collect();

  await Promise.all(requests.map((request) => ctx.db.delete(request._id)));
}

async function clearPasscodeGrantsForSession(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
) {
  const grants = await ctx.db
    .query("sessionPasscodeGrants")
    .withIndex("by_sessionId_userId", (q) => q.eq("sessionId", sessionId))
    .collect();

  await Promise.all(grants.map((grant) => ctx.db.delete(grant._id)));
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
  bookCoverUrl?: string;
  title?: string;
  synopsis?: string;
  createdBy: Id<"profiles">;
  createdAt: number;
  status: "active" | "ended";
  endedAt?: number;
  hostPasscode?: string;
  accessType?: SessionAccessType;
  isRepeatEnabled?: boolean;
  isPrivate?: boolean;
}) {
  const safeSession = { ...session };
  safeSession.accessType = resolveSessionAccessType(session);
  delete safeSession.hostPasscode;
  return safeSession;
}

async function getViewerProfileForQuery(ctx: QueryCtx) {
  const identity = await requireIdentity(ctx);
  const authUserId = getAuthUserIdFromIdentity(identity);
  return getProfileByAuthUserId(ctx, authUserId);
}

async function assertJoinAccessForViewer(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  viewerId: Id<"profiles">,
  session: {
    createdBy: Id<"profiles">;
    hostPasscode?: string;
    accessType?: SessionAccessType;
    isPrivate?: boolean;
  },
) {
  if (viewerId === session.createdBy) {
    return;
  }

  const participant = await getParticipantBySessionAndUser(ctx, sessionId, viewerId);
  if (participant?.role === "moderator") {
    return;
  }

  const accessType = resolveSessionAccessType(session);

  if (accessType === "public") {
    return;
  }

  if (accessType === "passcode") {
    const hasPasscodeAccess = await hasActivePasscodeGrant(ctx, sessionId, viewerId);
    if (!hasPasscodeAccess) {
      throw new Error("Passcode verification required before joining.");
    }
    return;
  }

  const request = await getJoinRequestBySessionAndRequester(ctx, sessionId, viewerId);
  if (request?.status !== "approved") {
    throw new Error("Host approval is required before joining this private session.");
  }
}

export const createSessionServer = mutation({
  args: {
    bookTitle: v.string(),
    authorName: v.optional(v.string()),
    bookCoverUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    accessType: v.optional(
      v.union(v.literal("public"), v.literal("passcode"), v.literal("private")),
    ),
    sessionPasscode: v.optional(v.string()),
    hostPasscode: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const bookTitle = args.bookTitle.trim();

    if (!bookTitle) {
      throw new Error("Book title is required.");
    }

    const viewer = await upsertViewerProfile(ctx);

    const normalizedPasscode = normalizePasscode(
      args.sessionPasscode ?? args.hostPasscode,
    );
    const requestedAccessType: SessionAccessType =
      args.accessType ??
      (args.isPrivate ? "private" : normalizedPasscode ? "passcode" : "public");

    if (requestedAccessType === "passcode" && !normalizedPasscode) {
      throw new Error("Passcode is required for passcode sessions.");
    }

    const sessionId = await ctx.db.insert("sessions", {
      bookTitle,
      authorName: normalizeOptional(args.authorName),
      bookCoverUrl: normalizeOptional(args.bookCoverUrl),
      title: normalizeOptional(args.title),
      synopsis: normalizeOptional(args.synopsis),
      hostPasscode:
        requestedAccessType === "passcode" && normalizedPasscode
          ? hashPasscode(normalizedPasscode)
          : undefined,
      accessType: requestedAccessType,
      isPrivate: requestedAccessType === "private" ? true : undefined,
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
    const viewerJoinRequest = viewer
      ? await getJoinRequestBySessionAndRequester(ctx, args.sessionId, viewer._id)
      : null;
    const viewerRole = (viewerParticipant?.role as "host" | "moderator" | "reader") ?? null;
    const isHost = viewerRole === "host";
    const isModerator = viewerRole === "moderator";
    const sessionAccessType = resolveSessionAccessType(session);
    const isPasscodeProtected =
      sessionAccessType === "passcode" && Boolean(session.hostPasscode);
    const hasPasscodeAccess =
      !isPasscodeProtected ||
      isHost ||
      isModerator ||
      Boolean(
        viewer &&
          (await hasActivePasscodeGrant(ctx, args.sessionId, viewer._id)),
      );

    return {
      session: sanitizeSession(session),
      hostName: host?.name,
      hostImage: host?.image,
      viewerUserId: viewer?._id,
      viewerIsGuest: Boolean(viewer?.isGuest),
      isHost,
      isModerator,
      viewerRole,
      accessType: sessionAccessType,
      isPasscodeProtected,
      hasPasscodeAccess,
      viewerJoinRequestStatus:
        (viewerJoinRequest?.status as JoinRequestStatus | undefined) ?? null,
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

    await assertJoinAccessForViewer(ctx, args.sessionId, viewer._id, session);

    const role = session.createdBy === viewer._id ? "host" : "reader";

    const participantId = await ctx.db.insert("participants", {
      sessionId: args.sessionId,
      userId: viewer._id,
      role,
      joinedAt: Date.now(),
    });

    const participant = await ctx.db.get(participantId);

    if (!participant) {
      throw new Error("Failed to create participant.");
    }

    // Auto-queue: non-host participants are automatically added to queue
    if (role !== "host" && session.status === "active") {
      const existingQueueItem = await getQueueItemBySessionAndUser(
        ctx,
        args.sessionId,
        viewer._id,
      );

      if (!existingQueueItem) {
        const queue = await getQueueItemsByPosition(ctx, args.sessionId);
        const hasActiveReaderOrWaiting = queue.some(
          (item) => item.status === "reading" || item.status === "waiting",
        );

        await ctx.db.insert("queueItems", {
          sessionId: args.sessionId,
          userId: viewer._id,
          position: queue.length > 0 ? queue[queue.length - 1].position + 1 : 0,
          status: hasActiveReaderOrWaiting ? "waiting" : "reading",
          isSkipped: false,
          skipReason: undefined,
          joinedAt: Date.now(),
        });
      }
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
        const roleOrder: Record<string, number> = { host: 0, moderator: 1, reader: 2 };
        const aOrder = roleOrder[a.role] ?? 99;
        const bOrder = roleOrder[b.role] ?? 99;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
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

export const requestPrivateSessionJoinServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);
    const accessType = resolveSessionAccessType(session);

    if (session.status === "ended") {
      throw new Error("Session has ended.");
    }

    if (accessType !== "private") {
      throw new Error("This session does not require host approval.");
    }

    const existingParticipant = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      viewer._id,
    );

    if (existingParticipant) {
      return { status: "approved" as JoinRequestStatus };
    }

    const existing = await getJoinRequestBySessionAndRequester(
      ctx,
      args.sessionId,
      viewer._id,
    );

    if (existing?.status === "pending" || existing?.status === "approved") {
      return { status: existing.status as JoinRequestStatus };
    }

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "pending",
        requestedAt: now,
        respondedAt: undefined,
        respondedBy: undefined,
      });
    } else {
      await ctx.db.insert("sessionJoinRequests", {
        sessionId: args.sessionId,
        requesterUserId: viewer._id,
        status: "pending",
        requestedAt: now,
      });
    }

    return { status: "pending" as JoinRequestStatus };
  },
});

export const listPendingSessionJoinRequestsServer = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileForQuery(ctx);

    if (!viewer) {
      throw new Error("Authentication required.");
    }

    await assertHost(ctx, args.sessionId, viewer._id);

    const requests = await ctx.db
      .query("sessionJoinRequests")
      .withIndex("by_sessionId_status_requestedAt", (q) =>
        q.eq("sessionId", args.sessionId).eq("status", "pending"),
      )
      .collect();

    const enriched = await Promise.all(
      requests.map(async (request) => {
        const requester = await ctx.db.get(request.requesterUserId);
        if (!requester) return null;
        return {
          requesterUserId: request.requesterUserId,
          requesterName: requester.name,
          requesterImage: requester.image,
          requestedAt: request.requestedAt,
        };
      }),
    );

    return enriched
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => b.requestedAt - a.requestedAt);
  },
});

export const respondToSessionJoinRequestServer = mutation({
  args: {
    sessionId: v.id("sessions"),
    requesterUserId: v.id("profiles"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    await assertHost(ctx, args.sessionId, viewer._id);

    const request = await getJoinRequestBySessionAndRequester(
      ctx,
      args.sessionId,
      args.requesterUserId,
    );

    if (!request) {
      throw new Error("Join request not found.");
    }

    await ctx.db.patch(request._id, {
      status: args.decision,
      respondedAt: Date.now(),
      respondedBy: viewer._id,
    });

    return request._id;
  },
});

export const getSessionMetadataPublic = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await getSessionById(ctx, args.sessionId);
    if (!session) return null;
    const accessType = resolveSessionAccessType(session);
    const host = await ctx.db.get(session.createdBy);
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    return {
      bookTitle: session.bookTitle,
      authorName: session.authorName,
      title: session.title,
      status: session.status,
      hostName: host?.name,
      memberCount: participants.length,
      accessType,
      isPasscodeProtected: accessType === "passcode" && Boolean(session.hostPasscode),
    };
  },
});

export const listPublicSessionsServer = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .order("desc")
      .take(50);

    const publicActive = sessions
      .filter(
        (s) =>
          s.status === "active" && resolveSessionAccessType(s) !== "private",
      )
      .slice(0, 8);

    return Promise.all(
      publicActive.map(async (session) => {
        const host = await ctx.db.get(session.createdBy);
        const participants = await ctx.db
          .query("participants")
          .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
          .collect();
        return {
          id: session._id,
          bookTitle: session.bookTitle,
          authorName: session.authorName,
          title: session.title,
          hostName: host?.name ?? "Unknown",
          hostImage: host?.image,
          memberCount: participants.length,
          isPasscodeProtected: !!session.hostPasscode,
          createdAt: session.createdAt,
        };
      }),
    );
  },
});

export const deleteSessionServer = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    if (session.createdBy !== viewer._id) {
      throw new Error("Only the session creator can delete this session.");
    }

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const row of participants) {
      await ctx.db.delete(row._id);
    }

    const queueItems = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_position", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const row of queueItems) {
      await ctx.db.delete(row._id);
    }

    const grants = await ctx.db
      .query("sessionPasscodeGrants")
      .withIndex("by_sessionId_userId", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const row of grants) {
      await ctx.db.delete(row._id);
    }

    const joinRequests = await ctx.db
      .query("sessionJoinRequests")
      .withIndex("by_sessionId_status_requestedAt", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .collect();
    for (const row of joinRequests) {
      await ctx.db.delete(row._id);
    }

    const words = await ctx.db
      .query("sessionWords")
      .withIndex("by_sessionId_createdAt", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const row of words) {
      await ctx.db.delete(row._id);
    }

    await ctx.db.delete(args.sessionId);
    return args.sessionId;
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

    const nonHostParticipations = participations.filter(
      (p) => p.role !== "host",
    );

    const sessions = await Promise.all(
      nonHostParticipations.map(async (p) => {
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

export const updateSessionServer = mutation({
  args: {
    sessionId: v.id("sessions"),
    bookTitle: v.optional(v.string()),
    authorName: v.optional(v.string()),
    bookCoverUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    accessType: v.optional(
      v.union(v.literal("public"), v.literal("passcode"), v.literal("private")),
    ),
    sessionPasscode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    if (session.status === "ended") {
      throw new Error("Cannot edit an ended session.");
    }

    await assertHostOrModerator(ctx, args.sessionId, viewer._id);

    const updates: {
      bookTitle?: string;
      authorName?: string;
      bookCoverUrl?: string;
      title?: string;
      synopsis?: string;
      accessType?: SessionAccessType;
      hostPasscode?: string;
      isPrivate?: boolean;
    } = {};
    const currentAccessType = resolveSessionAccessType(session);
    const desiredAccessType = args.accessType ?? currentAccessType;

    if (args.bookTitle !== undefined) {
      const trimmed = args.bookTitle.trim();
      if (!trimmed) throw new Error("Book title cannot be empty.");
      updates.bookTitle = trimmed;
    }
    if (args.authorName !== undefined) updates.authorName = normalizeOptional(args.authorName);
    if (args.bookCoverUrl !== undefined) updates.bookCoverUrl = normalizeOptional(args.bookCoverUrl);
    if (args.title !== undefined) updates.title = normalizeOptional(args.title);
    if (args.synopsis !== undefined) updates.synopsis = normalizeOptional(args.synopsis);

    if (args.accessType !== undefined) {
      updates.accessType = desiredAccessType;

      if (desiredAccessType === "public") {
        updates.hostPasscode = undefined;
        updates.isPrivate = undefined;
      }

      if (desiredAccessType === "private") {
        updates.hostPasscode = undefined;
        updates.isPrivate = true;
      }

      if (desiredAccessType === "passcode") {
        const normalizedPasscode = normalizePasscode(args.sessionPasscode);
        const hasCurrentPasscode =
          currentAccessType === "passcode" && Boolean(session.hostPasscode);
        if (!normalizedPasscode && !hasCurrentPasscode) {
          throw new Error("Passcode is required when switching to passcode mode.");
        }
        if (normalizedPasscode) {
          updates.hostPasscode = hashPasscode(normalizedPasscode);
        }
        updates.isPrivate = undefined;
      }
    } else if (args.sessionPasscode !== undefined) {
      if (currentAccessType !== "passcode") {
        throw new Error("Passcode can only be changed in passcode mode.");
      }
      const normalizedPasscode = normalizePasscode(args.sessionPasscode);
      if (!normalizedPasscode) {
        throw new Error("Passcode cannot be empty.");
      }
      updates.hostPasscode = hashPasscode(normalizedPasscode);
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.sessionId, updates);
    }

    const didTypeChange = desiredAccessType !== currentAccessType;
    const didRotatePasscode = updates.hostPasscode !== undefined;

    if (didTypeChange && (currentAccessType === "private" || desiredAccessType !== "private")) {
      await clearJoinRequestsForSession(ctx, args.sessionId);
    }
    if (didTypeChange && currentAccessType === "passcode") {
      await clearPasscodeGrantsForSession(ctx, args.sessionId);
    }
    if (didRotatePasscode) {
      await clearPasscodeGrantsForSession(ctx, args.sessionId);
    }

    return args.sessionId;
  },
});

export const setParticipantRoleServer = mutation({
  args: {
    sessionId: v.id("sessions"),
    targetUserId: v.id("profiles"),
    newRole: v.union(v.literal("moderator"), v.literal("reader")),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    if (session.status === "ended") {
      throw new Error("Cannot change roles in an ended session.");
    }

    await assertHost(ctx, args.sessionId, viewer._id);

    const target = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      args.targetUserId,
    );

    if (!target) {
      throw new Error("Target user is not a participant.");
    }

    if (target.role === "host") {
      throw new Error("Cannot change host role.");
    }

    await ctx.db.patch(target._id, { role: args.newRole });
    return target._id;
  },
});

export const kickParticipantServer = mutation({
  args: {
    sessionId: v.id("sessions"),
    targetUserId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);
    const session = await getSessionByIdOrThrow(ctx, args.sessionId);

    if (session.status === "ended") {
      throw new Error("Cannot kick from an ended session.");
    }

    await assertHostOrModerator(ctx, args.sessionId, viewer._id);

    const target = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      args.targetUserId,
    );

    if (!target) {
      throw new Error("Target user is not a participant.");
    }

    if (target.role === "host") {
      throw new Error("Cannot kick the host.");
    }

    // If kicker is moderator, they cannot kick other moderators
    const kickerParticipant = await getParticipantBySessionAndUser(
      ctx,
      args.sessionId,
      viewer._id,
    );
    if (kickerParticipant?.role === "moderator" && target.role === "moderator") {
      throw new Error("Moderators cannot kick other moderators.");
    }

    // Remove from queue first
    await removeUserFromQueueForSession(ctx, args.sessionId, args.targetUserId);

    // Remove participant
    await ctx.db.delete(target._id);

    return target._id;
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

      const joinRequests = await ctx.db
        .query("sessionJoinRequests")
        .withIndex("by_sessionId_status_requestedAt", (q) =>
          q.eq("sessionId", session._id),
        )
        .collect();

      for (const row of joinRequests) {
        await ctx.db.delete(row._id);
      }

      const words = await ctx.db
        .query("sessionWords")
        .withIndex("by_sessionId_createdAt", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const row of words) {
        await ctx.db.delete(row._id);
      }

      await ctx.db.delete(session._id);
    }

    return { deleted: expired.length };
  },
});
