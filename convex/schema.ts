import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    authUserId: v.id("users"),
    tokenIdentifier: v.string(),
    provider: v.optional(v.string()),
    name: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    isGuest: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authUserId", ["authUserId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  sessions: defineTable({
    bookTitle: v.string(),
    authorName: v.optional(v.string()),
    bookCoverUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    hostPasscode: v.optional(v.string()),
    accessType: v.optional(
      v.union(v.literal("public"), v.literal("passcode"), v.literal("private")),
    ),
    isRepeatEnabled: v.optional(v.boolean()),
    isPrivate: v.optional(v.boolean()),
    createdBy: v.id("profiles"),
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("ended")),
    endedAt: v.optional(v.number()),
  }).index("by_createdBy_createdAt", ["createdBy", "createdAt"]),

  participants: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("profiles"),
    role: v.union(v.literal("host"), v.literal("moderator"), v.literal("reader")),
    joinedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_sessionId_userId", ["sessionId", "userId"])
    .index("by_userId", ["userId"]),

  queueItems: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("profiles"),
    position: v.number(),
    status: v.union(v.literal("waiting"), v.literal("reading"), v.literal("done")),
    joinedAt: v.number(),
  })
    .index("by_sessionId_position", ["sessionId", "position"])
    .index("by_sessionId_userId", ["sessionId", "userId"])
    .index("by_userId", ["userId"]),

  sessionPasscodeGrants: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("profiles"),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sessionId_userId", ["sessionId", "userId"])
    .index("by_userId", ["userId"]),

  sessionJoinRequests: defineTable({
    sessionId: v.id("sessions"),
    requesterUserId: v.id("profiles"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    requestedAt: v.number(),
    respondedAt: v.optional(v.number()),
    respondedBy: v.optional(v.id("profiles")),
  })
    .index("by_sessionId_requesterUserId", ["sessionId", "requesterUserId"])
    .index("by_sessionId_status_requestedAt", ["sessionId", "status", "requestedAt"])
    .index("by_requesterUserId", ["requesterUserId"]),

  pushSubscriptions: defineTable({
    userId: v.id("profiles"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  }).index("by_userId", ["userId"]),

  sessionWords: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("profiles"),
    word: v.string(),
    context: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sessionId_createdAt", ["sessionId", "createdAt"])
    .index("by_sessionId_userId", ["sessionId", "userId"])
    .index("by_userId", ["userId"]),

  feedback: defineTable({
    message: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
