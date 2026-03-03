import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const submitFeedback = mutation({
  args: {
    message: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const message = args.message.trim();
    if (!message || message.length < 4) {
      throw new Error("Message is too short.");
    }
    await ctx.db.insert("feedback", {
      message: message.slice(0, 2000),
      name: args.name?.trim().slice(0, 80) || undefined,
      createdAt: Date.now(),
    });
  },
});
