import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeServerKey(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function assertServerKey(serverKey: string) {
  const expectedKey = normalizeServerKey(process.env.SESSIONS_SERVER_KEY);
  const providedKey = normalizeServerKey(serverKey);

  if (!expectedKey) {
    throw new Error("Server key not configured");
  }

  if (providedKey !== expectedKey) {
    throw new Error("Forbidden");
  }
}

async function getUserByDiscordIdOrThrow(
  ctx: MutationCtx | QueryCtx,
  discordId: string,
) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_discordId", (q) => q.eq("discordId", discordId))
    .unique();

  if (!user) {
    throw new Error("User not found. Refresh the dashboard and try again.");
  }

  return user;
}

export const createSessionServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    bookTitle: v.string(),
    authorName: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const bookTitle = args.bookTitle.trim();

    if (!bookTitle) {
      throw new Error("Book title is required.");
    }

    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);

    const sessionId = await ctx.db.insert("sessions", {
      bookTitle,
      authorName: normalizeOptional(args.authorName),
      title: normalizeOptional(args.title),
      synopsis: normalizeOptional(args.synopsis),
      createdBy: user._id,
      createdAt: Date.now(),
      status: "active",
    });

    return sessionId;
  },
});

export const listMySessionsServer = query({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);

    return ctx.db
      .query("sessions")
      .withIndex("by_createdBy_createdAt", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .collect();
  },
});

export const endSessionServer = mutation({
  args: {
    serverKey: v.string(),
    discordId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    assertServerKey(args.serverKey);
    const user = await getUserByDiscordIdOrThrow(ctx, args.discordId);

    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new Error("Session not found.");
    }

    if (session.createdBy !== user._id) {
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

// Deprecated insecure endpoints kept only to fail closed if called directly.
export const createSession = mutation({
  args: {},
  handler: async () => {
    throw new Error("Deprecated insecure endpoint. Use createSessionServer.");
  },
});

export const listMySessions = query({
  args: {},
  handler: async () => {
    throw new Error("Deprecated insecure endpoint. Use listMySessionsServer.");
  },
});

export const endSession = mutation({
  args: {},
  handler: async () => {
    throw new Error("Deprecated insecure endpoint. Use endSessionServer.");
  },
});
