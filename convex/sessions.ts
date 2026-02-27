import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const createSession = mutation({
  args: {
    userId: v.id("users"),
    bookTitle: v.string(),
    authorName: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Implement server-verified identity via Convex Auth or Next.js server
    // proxy. For now we rely on userId obtained from upsertCurrentUser.
    const bookTitle = args.bookTitle.trim();

    if (!bookTitle) {
      throw new Error("Book title is required.");
    }

    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found. Refresh the dashboard and try again.");
    }

    const sessionId = await ctx.db.insert("sessions", {
      bookTitle,
      authorName: normalizeOptional(args.authorName),
      title: normalizeOptional(args.title),
      synopsis: normalizeOptional(args.synopsis),
      createdBy: args.userId,
      createdAt: Date.now(),
      status: "active",
    });

    return sessionId;
  },
});

export const listMySessions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return [];
    }

    return ctx.db
      .query("sessions")
      .withIndex("by_createdBy_createdAt", (q) => q.eq("createdBy", args.userId))
      .order("desc")
      .collect();
  },
});

export const endSession = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found.");
    }

    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new Error("Session not found.");
    }

    if (session.createdBy !== args.userId) {
      throw new Error("You can only end your own session.");
    }

    if (session.status === "ended") {
      return args.sessionId;
    }

    await ctx.db.patch(args.sessionId, {
      status: "ended",
      endedAt: Date.now(),
    });

    return args.sessionId;
  },
});
