import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a URL (with uniqueness check)
export const addUrl = mutation({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if URL already exists
    const existingUrl = await ctx.db
      .query("urls")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    
    if (existingUrl) {
      // URL already exists, update it instead
      await ctx.db.patch(existingUrl._id, {
        title: args.title || existingUrl.title,
        description: args.description || existingUrl.description,
        tags: args.tags || existingUrl.tags,
        updatedAt: now,
      });
      
      return {
        id: existingUrl._id,
        url: existingUrl.url,
        existed: true,
        message: "URL already exists, updated with new information"
      };
    }
    
    // URL doesn't exist, create new entry
    const urlId = await ctx.db.insert("urls", {
      url: args.url,
      title: args.title,
      description: args.description,
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });
    
    return {
      id: urlId,
      url: args.url,
      existed: false,
      message: "URL added successfully"
    };
  },
});

// Get all URLs
export const getAllUrls = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    return await ctx.db
      .query("urls")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
  },
});

// Get a specific URL by ID
export const getUrlById = query({
  args: { id: v.id("urls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get URL by URL string
export const getUrlByString = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("urls")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
  },
});

// Check if URL exists
export const urlExists = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const existingUrl = await ctx.db
      .query("urls")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    
    return {
      exists: !!existingUrl,
      url: existingUrl || null
    };
  },
});

// Update URL metadata
export const updateUrl = mutation({
  args: {
    id: v.id("urls"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});

// Delete URL
export const deleteUrl = mutation({
  args: { id: v.id("urls") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Search URLs by tags
export const getUrlsByTags = query({
  args: { 
    tags: v.array(v.string()),
    matchAll: v.optional(v.boolean()), // true = match all tags, false = match any tag
  },
  handler: async (ctx, args) => {
    const allUrls = await ctx.db.query("urls").collect();
    const matchAll = args.matchAll || false;
    
    return allUrls.filter((url) => {
      if (!url.tags || url.tags.length === 0) return false;
      
      if (matchAll) {
        // All provided tags must be present
        return args.tags.every(tag => url.tags!.includes(tag));
      } else {
        // At least one provided tag must be present
        return args.tags.some(tag => url.tags!.includes(tag));
      }
    });
  },
});

// Get URLs count
export const getUrlsCount = query({
  handler: async (ctx) => {
    const urls = await ctx.db.query("urls").collect();
    return urls.length;
  },
});

// Batch add URLs (useful for importing)
export const batchAddUrls = mutation({
  args: {
    urls: v.array(v.object({
      url: v.string(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = [];
    
    for (const urlData of args.urls) {
      // Check if URL already exists
      const existingUrl = await ctx.db
        .query("urls")
        .withIndex("by_url", (q) => q.eq("url", urlData.url))
        .first();
      
      if (existingUrl) {
        results.push({
          url: urlData.url,
          id: existingUrl._id,
          existed: true,
          action: "skipped"
        });
      } else {
        const urlId = await ctx.db.insert("urls", {
          url: urlData.url,
          title: urlData.title,
          description: urlData.description,
          tags: urlData.tags || [],
          createdAt: now,
          updatedAt: now,
        });
        
        results.push({
          url: urlData.url,
          id: urlId,
          existed: false,
          action: "added"
        });
      }
    }
    
    return {
      total: args.urls.length,
      added: results.filter(r => !r.existed).length,
      skipped: results.filter(r => r.existed).length,
      results
    };
  },
});
