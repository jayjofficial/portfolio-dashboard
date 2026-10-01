import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get the latest portfolio document
export const get = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db.query("portfolio").order("desc").first();
    return doc ? doc.data : null;
  },
});

// Mutation to save or update the portfolio document
export const save = mutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("portfolio").first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("portfolio", {
        data: args.data,
        updatedAt: now,
      });
    }
  },
});
