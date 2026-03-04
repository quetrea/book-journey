import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = MutationCtx | QueryCtx;

export type ParticipantRole = "host" | "moderator" | "reader";

const ROLE_HIERARCHY: Record<ParticipantRole, number> = {
  host: 3,
  moderator: 2,
  reader: 1,
};

export async function getParticipant(
  ctx: Ctx,
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

export async function assertRole(
  ctx: Ctx,
  sessionId: Id<"sessions">,
  userId: Id<"profiles">,
  minimumRole: ParticipantRole,
) {
  const participant = await getParticipant(ctx, sessionId, userId);

  if (!participant) {
    throw new Error("Not a participant in this session.");
  }

  const actual = ROLE_HIERARCHY[participant.role as ParticipantRole] ?? 0;
  const required = ROLE_HIERARCHY[minimumRole];

  if (actual < required) {
    throw new Error(`Requires ${minimumRole} role or higher.`);
  }

  return participant;
}

export async function assertHost(
  ctx: Ctx,
  sessionId: Id<"sessions">,
  userId: Id<"profiles">,
) {
  return assertRole(ctx, sessionId, userId, "host");
}

export async function assertHostOrModerator(
  ctx: Ctx,
  sessionId: Id<"sessions">,
  userId: Id<"profiles">,
) {
  return assertRole(ctx, sessionId, userId, "moderator");
}
