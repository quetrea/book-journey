import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { getViewerProfile, upsertViewerProfile, requireIdentity, getAuthUserIdFromIdentity, getProfileByAuthUserId } from "./lib/authProfile";

export const upsertCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await upsertViewerProfile(ctx);
    return profile._id;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return getViewerProfile(ctx);
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, { displayName, bio }) => {
    const identity = await requireIdentity(ctx);
    const authUserId = getAuthUserIdFromIdentity(identity);
    const profile = await getProfileByAuthUserId(ctx, authUserId);

    if (!profile) {
      throw new Error("Profile not found.");
    }

    await ctx.db.patch(profile._id, {
      displayName: displayName?.trim() || undefined,
      bio: bio?.trim() || undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Transfer host role for a session to the best candidate.
 * Priority: oldest moderator -> oldest reader -> end session.
 */
async function transferHostIfNeeded(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  hostProfileId: Id<"profiles">,
) {
  const session = await ctx.db.get(sessionId);
  if (!session || session.status === "ended") return;

  const participants = await ctx.db
    .query("participants")
    .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
    .collect();

  const candidates = participants
    .filter((p) => p.userId !== hostProfileId)
    .sort((a, b) => a.joinedAt - b.joinedAt);

  const newHost =
    candidates.find((p) => p.role === "moderator") ??
    candidates.find((p) => p.role === "reader");

  if (newHost) {
    await ctx.db.patch(newHost._id, { role: "host" });
  } else {
    // No one left — end the session
    await ctx.db.patch(sessionId, { status: "ended", endedAt: Date.now() });
    const queue = await ctx.db
      .query("queueItems")
      .withIndex("by_sessionId_position", (q) => q.eq("sessionId", sessionId))
      .collect();
    await Promise.all(queue.map((item) => ctx.db.patch(item._id, { status: "done" })));
  }
}

/**
 * Permanently delete the authenticated user's account and all associated data.
 * - Transfers host role for active sessions before removing.
 * - Deletes all participants, queue items, words, subscriptions, passcode grants.
 * - Deletes the profile and the underlying auth user record.
 * - Idempotent: returns { ok: true } even if profile is already gone.
 */
export const deleteMyAccountServer = mutation({
  args: {},
  handler: async (ctx): Promise<{ ok: true }> => {
    const identity = await requireIdentity(ctx);
    const authUserId = getAuthUserIdFromIdentity(identity);
    const profile = await getProfileByAuthUserId(ctx, authUserId);

    if (!profile) {
      return { ok: true };
    }

    const profileId = profile._id;

    // 1. Handle host sessions — transfer or end
    const participations = await ctx.db
      .query("participants")
      .withIndex("by_userId", (q) => q.eq("userId", profileId))
      .collect();

    for (const p of participations) {
      if (p.role === "host") {
        await transferHostIfNeeded(ctx, p.sessionId, profileId);
      }
    }

    // 2. Delete all participant records
    await Promise.all(participations.map((p) => ctx.db.delete(p._id)));

    // 3. Delete all queue items
    const queueItems = await ctx.db
      .query("queueItems")
      .withIndex("by_userId", (q) => q.eq("userId", profileId))
      .collect();
    await Promise.all(queueItems.map((item) => ctx.db.delete(item._id)));

    // 4. Delete all session words
    const words = await ctx.db
      .query("sessionWords")
      .withIndex("by_userId", (q) => q.eq("userId", profileId))
      .collect();
    await Promise.all(words.map((w) => ctx.db.delete(w._id)));

    // 5. Delete all passcode grants
    const grants = await ctx.db
      .query("sessionPasscodeGrants")
      .withIndex("by_userId", (q) => q.eq("userId", profileId))
      .collect();
    await Promise.all(grants.map((g) => ctx.db.delete(g._id)));

    // 6. Delete push subscriptions
    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", profileId))
      .collect();
    await Promise.all(subs.map((s) => ctx.db.delete(s._id)));

    // 7. Delete profile
    await ctx.db.delete(profileId);

    // 8. Delete auth user record
    const authUser = await ctx.db.get(authUserId);
    if (authUser) {
      await ctx.db.delete(authUserId);
    }

    return { ok: true };
  },
});
