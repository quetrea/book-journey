import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    discordId: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_discordId", ["discordId"]),

  sessions: defineTable({
    bookTitle: v.string(),
    authorName: v.optional(v.string()),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("ended")),
    endedAt: v.optional(v.number()),
  }).index("by_createdBy_createdAt", ["createdBy", "createdAt"]),

  participants: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    role: v.union(v.literal("host"), v.literal("reader")),
    joinedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_sessionId_userId", ["sessionId", "userId"]),
});
