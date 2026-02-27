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
});
