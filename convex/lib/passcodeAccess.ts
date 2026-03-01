import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = MutationCtx | QueryCtx;

export const PASSCODE_GRANT_TTL_MS = 15 * 60 * 1000;

export async function hasActivePasscodeGrant(
  ctx: AuthCtx,
  sessionId: Id<"sessions">,
  userId: Id<"profiles">,
) {
  const grant = await ctx.db
    .query("sessionPasscodeGrants")
    .withIndex("by_sessionId_userId", (q) =>
      q.eq("sessionId", sessionId).eq("userId", userId),
    )
    .unique();

  if (!grant) {
    return false;
  }

  return grant.expiresAt > Date.now();
}

export async function grantPasscodeAccess(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  userId: Id<"profiles">,
) {
  const now = Date.now();
  const expiresAt = now + PASSCODE_GRANT_TTL_MS;

  const existing = await ctx.db
    .query("sessionPasscodeGrants")
    .withIndex("by_sessionId_userId", (q) =>
      q.eq("sessionId", sessionId).eq("userId", userId),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { expiresAt, createdAt: now });
    return existing._id;
  }

  return ctx.db.insert("sessionPasscodeGrants", {
    sessionId,
    userId,
    expiresAt,
    createdAt: now,
  });
}
