import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("balances")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 100);
  },
});

export const latest = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("balances")
      .withIndex("by_timestamp")
      .order("desc")
      .first();
  },
});

export const recordBalance = action({
  args: {
    timestamp: v.number(),
    jpy: v.number(),
    btc: v.number(),
    btcValueJpy: v.number(),
    totalJpy: v.number(),
    pnlFromStart: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(insertBalance, args);
  },
});

export const insertBalance = mutation({
  args: {
    timestamp: v.number(),
    jpy: v.number(),
    btc: v.number(),
    btcValueJpy: v.number(),
    totalJpy: v.number(),
    pnlFromStart: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("balances", args);
  },
});
