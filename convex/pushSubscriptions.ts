import { v } from "convex/values";

import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { getViewerProfile, upsertViewerProfile } from "./lib/authProfile";

export const savePushSubscription = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await upsertViewerProfile(ctx);

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", viewer._id))
      .filter((q) => q.eq(q.field("endpoint"), args.endpoint))
      .unique();

    if (existing) {
      return existing._id;
    }

    return ctx.db.insert("pushSubscriptions", {
      userId: viewer._id,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
    });
  },
});

export const deletePushSubscription = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfile(ctx);

    if (!viewer) {
      return null;
    }

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", viewer._id))
      .filter((q) => q.eq(q.field("endpoint"), args.endpoint))
      .unique();

    if (!existing) {
      return null;
    }

    await ctx.db.delete(existing._id);
    return existing._id;
  },
});

export const getSubscriptionsForUser = internalQuery({
  args: {
    userId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const removeStaleSubscription = internalMutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .filter((q) => q.eq(q.field("endpoint"), args.endpoint))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
