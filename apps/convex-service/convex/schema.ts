
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // URLs collection - stores unique URLs with metadata
  urls: defineTable({
    url: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_url", ["url"]) // Unique index for URL lookups
    .index("by_created_at", ["createdAt"]),
});