import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertCurrentUser = mutation({
  args: {
    discordId: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_discordId", (q) => q.eq("discordId", args.discordId))
      .unique();

    if (existingUser) {
      const updates: { name?: string; image?: string } = {};

      if (existingUser.name !== args.name) {
        updates.name = args.name;
      }

      if (existingUser.image !== args.image) {
        updates.image = args.image;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existingUser._id, updates);
      }

      return existingUser._id;
    }

    return ctx.db.insert("users", {
      discordId: args.discordId,
      name: args.name,
      image: args.image,
      createdAt: Date.now(),
    });
  },
});

export const getUserByDiscordId = query({
  args: {
    discordId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_discordId", (q) => q.eq("discordId", args.discordId))
      .unique();
  },
});
