import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  getViewerProfile,
  upsertViewerProfile,
  requireIdentity,
  getAuthSessionIdFromIdentity,
  getAuthUserIdFromIdentity,
  getProfileByAuthUserId,
} from "./lib/authProfile";

const INACTIVE_ACCOUNT_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const ACTIVITY_TOUCH_MIN_INTERVAL_MS = 5 * 60 * 1000;
const INACTIVE_CLEANUP_BATCH_SIZE = 24;

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

export const getSessionState = query({
  args: {},
  handler: async (ctx): Promise<{ isAuthenticated: boolean; valid: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { isAuthenticated: false, valid: false };
    }

    try {
      const authUserId = getAuthUserIdFromIdentity(identity);
      const sessionId = getAuthSessionIdFromIdentity(identity);
      const session = await ctx.db.get(sessionId);
      const valid =
        !!session &&
        session.userId === authUserId &&
        session.expirationTime > Date.now();
      return { isAuthenticated: true, valid };
    } catch {
      return { isAuthenticated: true, valid: false };
    }
  },
});

export const getAuthUserIdByDiscordAccountIdInternal = internalQuery({
  args: {
    discordUserId: v.string(),
  },
  handler: async (ctx, { discordUserId }): Promise<Id<"users"> | null> => {
    const normalizedDiscordUserId = discordUserId.trim();

    if (!normalizedDiscordUserId) {
      return null;
    }

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "discord").eq("providerAccountId", normalizedDiscordUserId),
      )
      .unique();

    return account?.userId ?? null;
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

async function deleteProfileAndRelatedData(ctx: MutationCtx, profile: Doc<"profiles">) {
  const profileId = profile._id;

  // 1. Handle host sessions — transfer or end
  const participations = await ctx.db
    .query("participants")
    .withIndex("by_userId", (q) => q.eq("userId", profileId))
    .collect();

  for (const participation of participations) {
    if (participation.role === "host") {
      await transferHostIfNeeded(ctx, participation.sessionId, profileId);
    }
  }

  // 2. Delete all participant records
  await Promise.all(participations.map((participation) => ctx.db.delete(participation._id)));

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
  await Promise.all(words.map((word) => ctx.db.delete(word._id)));

  // 5. Delete all passcode grants
  const grants = await ctx.db
    .query("sessionPasscodeGrants")
    .withIndex("by_userId", (q) => q.eq("userId", profileId))
    .collect();
  await Promise.all(grants.map((grant) => ctx.db.delete(grant._id)));

  // 6. Delete all private join requests made by this user
  const joinRequests = await ctx.db
    .query("sessionJoinRequests")
    .withIndex("by_requesterUserId", (q) => q.eq("requesterUserId", profileId))
    .collect();
  await Promise.all(joinRequests.map((request) => ctx.db.delete(request._id)));

  // 7. Delete push subscriptions
  const subscriptions = await ctx.db
    .query("pushSubscriptions")
    .withIndex("by_userId", (q) => q.eq("userId", profileId))
    .collect();
  await Promise.all(subscriptions.map((subscription) => ctx.db.delete(subscription._id)));

  // 8. Delete profile
  await ctx.db.delete(profileId);

  // 9. Delete auth user record
  const authUser = await ctx.db.get(profile.authUserId);
  if (authUser) {
    await ctx.db.delete(profile.authUserId);
  }
}

/**
 * Permanently delete the authenticated user's account and all associated data.
 * - Transfers host role for active sessions before removing.
 * - Deletes all participants, queue items, words, subscriptions, passcode grants, join requests.
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

    await deleteProfileAndRelatedData(ctx, profile);

    return { ok: true };
  },
});

export const touchActivityServer = mutation({
  args: {},
  handler: async (ctx): Promise<{ touched: boolean }> => {
    const profile = await upsertViewerProfile(ctx);
    const now = Date.now();

    if (now - profile.updatedAt < ACTIVITY_TOUCH_MIN_INTERVAL_MS) {
      return { touched: false };
    }

    await ctx.db.patch(profile._id, { updatedAt: now });
    return { touched: true };
  },
});

export const cleanupInactiveAccounts = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deletedCount: number; reachedBatchLimit: boolean }> => {
    const cutoff = Date.now() - INACTIVE_ACCOUNT_TTL_MS;
    const staleProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_updatedAt", (q) => q.lt("updatedAt", cutoff))
      .take(INACTIVE_CLEANUP_BATCH_SIZE);

    for (const staleProfile of staleProfiles) {
      await deleteProfileAndRelatedData(ctx, staleProfile);
    }

    return {
      deletedCount: staleProfiles.length,
      reachedBatchLimit: staleProfiles.length >= INACTIVE_CLEANUP_BATCH_SIZE,
    };
  },
});
