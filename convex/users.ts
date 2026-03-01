import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
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
