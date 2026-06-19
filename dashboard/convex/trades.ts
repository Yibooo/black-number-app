import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trades")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("trades").withIndex("by_timestamp").order("desc").collect();
  },
});

// BOTから呼ばれる HTTP Action
export const recordTrade = action({
  args: {
    timestamp: v.number(),
    symbol: v.string(),
    side: v.union(v.literal("buy"), v.literal("sell")),
    price: v.number(),
    amount: v.number(),
    cost: v.number(),
    fee: v.number(),
    pnl: v.number(),
    strategy: v.union(v.literal("grid"), v.literal("trend"), v.literal("manual")),
    exchange: v.union(v.literal("gmo"), v.literal("bybit")),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(insertTrade, args);
  },
});

export const insertTrade = mutation({
  args: {
    timestamp: v.number(),
    symbol: v.string(),
    side: v.union(v.literal("buy"), v.literal("sell")),
    price: v.number(),
    amount: v.number(),
    cost: v.number(),
    fee: v.number(),
    pnl: v.number(),
    strategy: v.union(v.literal("grid"), v.literal("trend"), v.literal("manual")),
    exchange: v.union(v.literal("gmo"), v.literal("bybit")),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("trades", args);
  },
});
