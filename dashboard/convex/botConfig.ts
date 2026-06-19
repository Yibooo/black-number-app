import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("botConfig").first();
  },
});

export const upsert = mutation({
  args: {
    gridCount: v.number(),
    gridRangePct: v.number(),
    gridOrderSizePct: v.number(),
    stopLossPct: v.number(),
    takeProfitPct: v.number(),
    fastMa: v.number(),
    slowMa: v.number(),
    rsiPeriod: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("botConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("botConfig", args);
    }
  },
});

// デフォルト設定を初期化
export const initDefaults = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("botConfig").first();
    if (!existing) {
      await ctx.db.insert("botConfig", {
        gridCount: 10,
        gridRangePct: 0.10,
        gridOrderSizePct: 0.08,
        stopLossPct: 0.05,
        takeProfitPct: 0.10,
        fastMa: 9,
        slowMa: 21,
        rsiPeriod: 14,
      });
    }
  },
});
