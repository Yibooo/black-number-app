"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import BalanceCard from "@/components/BalanceCard";
import BotStatusBadge from "@/components/BotStatusBadge";
import PnlChart from "@/components/PnlChart";
import TradeTable from "@/components/TradeTable";

export default function DashboardPage() {
  const status = useQuery(api.botStatus.get);
  const latestBalance = useQuery(api.balances.latest);
  const recentTrades = useQuery(api.trades.listRecent, { limit: 10 });
  const balanceHistory = useQuery(api.balances.listRecent, { limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        {status && <BotStatusBadge status={status} />}
      </div>

      {/* 残高カード */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          title="総資産"
          value={latestBalance ? `¥${latestBalance.totalJpy.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}` : "---"}
          sub={latestBalance ? `BTC: ${latestBalance.btc.toFixed(6)}` : ""}
        />
        <BalanceCard
          title="円残高"
          value={latestBalance ? `¥${latestBalance.jpy.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}` : "---"}
        />
        <BalanceCard
          title="BTC評価額"
          value={latestBalance ? `¥${latestBalance.btcValueJpy.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}` : "---"}
        />
        <BalanceCard
          title="累計損益"
          value={
            latestBalance
              ? `${latestBalance.pnlFromStart >= 0 ? "+" : ""}¥${latestBalance.pnlFromStart.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}`
              : "---"
          }
          highlight={
            latestBalance
              ? latestBalance.pnlFromStart >= 0
                ? "positive"
                : "negative"
              : undefined
          }
        />
      </div>

      {/* 損益グラフ */}
      {balanceHistory && balanceHistory.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-400">累計損益推移</h2>
          <PnlChart data={[...balanceHistory].reverse()} />
        </div>
      )}

      {/* 直近の取引 */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400">直近の取引</h2>
          <a href="/trades" className="text-xs text-blue-400 hover:text-blue-300">
            すべて見る →
          </a>
        </div>
        {recentTrades ? (
          <TradeTable trades={recentTrades} />
        ) : (
          <p className="text-sm text-gray-500">取引履歴なし</p>
        )}
      </div>
    </div>
  );
}
