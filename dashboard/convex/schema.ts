import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 取引履歴
  trades: defineTable({
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
  }).index("by_timestamp", ["timestamp"]),

  // 残高スナップショット
  balances: defineTable({
    timestamp: v.number(),
    jpy: v.number(),
    btc: v.number(),
    btcValueJpy: v.number(),
    totalJpy: v.number(),
    pnlFromStart: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  // BOT稼働状態（シングルトン）
  botStatus: defineTable({
    running: v.boolean(),
    mode: v.union(v.literal("paper"), v.literal("live")),
    exchange: v.union(v.literal("gmo"), v.literal("bybit")),
    symbol: v.string(),
    cycleCount: v.number(),
    lastHeartbeat: v.number(),
    errorMessage: v.optional(v.string()),
  }),

  // BOT設定
  botConfig: defineTable({
    gridCount: v.number(),
    gridRangePct: v.number(),
    gridOrderSizePct: v.number(),
    stopLossPct: v.number(),
    takeProfitPct: v.number(),
    fastMa: v.number(),
    slowMa: v.number(),
    rsiPeriod: v.number(),
  }),
});
