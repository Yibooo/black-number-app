import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("botStatus").first();
  },
});

export const updateStatus = action({
  args: {
    running: v.boolean(),
    mode: v.union(v.literal("paper"), v.literal("live")),
    exchange: v.union(v.literal("gmo"), v.literal("bybit")),
    symbol: v.string(),
    cycleCount: v.number(),
    lastHeartbeat: v.number(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(upsertStatus, args);
  },
});

export const upsertStatus = mutation({
  args: {
    running: v.boolean(),
    mode: v.union(v.literal("paper"), v.literal("live")),
    exchange: v.union(v.literal("gmo"), v.literal("bybit")),
    symbol: v.string(),
    cycleCount: v.number(),
    lastHeartbeat: v.number(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("botStatus").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("botStatus", args);
    }
  },
});
