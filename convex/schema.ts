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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authUserId", ["authUserId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  sessions: defineTable({
    bookTitle: v.string(),
    authorName: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    hostPasscode: v.optional(v.string()),
    createdBy: v.id("profiles"),
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("ended")),
    endedAt: v.optional(v.number()),
  }).index("by_createdBy_createdAt", ["createdBy", "createdAt"]),

  participants: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("profiles"),
    role: v.union(v.literal("host"), v.literal("reader")),
    joinedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_sessionId_userId", ["sessionId", "userId"]),

  queueItems: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("profiles"),
    position: v.number(),
    status: v.union(v.literal("waiting"), v.literal("reading"), v.literal("done")),
    joinedAt: v.number(),
  })
    .index("by_sessionId_position", ["sessionId", "position"])
    .index("by_sessionId_userId", ["sessionId", "userId"]),

  sessionPasscodeGrants: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("profiles"),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_sessionId_userId", ["sessionId", "userId"]),

  pushSubscriptions: defineTable({
    userId: v.id("profiles"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  }).index("by_userId", ["userId"]),
});
