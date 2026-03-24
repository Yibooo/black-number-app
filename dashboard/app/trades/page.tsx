"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TradeTable from "@/components/TradeTable";
import PnlChart from "@/components/PnlChart";

export default function TradesPage() {
  const trades = useQuery(api.trades.listAll);
  const balanceHistory = useQuery(api.balances.listRecent, { limit: 200 });

  const totalPnl = trades?.reduce((sum, t) => sum + t.pnl, 0) ?? 0;
  const buyCount = trades?.filter((t) => t.side === "buy").length ?? 0;
  const sellCount = trades?.filter((t) => t.side === "sell").length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">取引履歴</h1>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500">総取引数</p>
          <p className="text-2xl font-bold">{trades?.length ?? 0}</p>
          <p className="text-xs text-gray-500">買 {buyCount} / 売 {sellCount}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500">累計損益</p>
          <p className={`text-2xl font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalPnl >= 0 ? "+" : ""}¥{totalPnl.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500">平均損益 / 取引</p>
          <p className="text-2xl font-bold">
            {trades && trades.length > 0
              ? `¥${(totalPnl / trades.length).toLocaleString("ja-JP", { maximumFractionDigits: 0 })}`
              : "---"}
          </p>
        </div>
      </div>

      {/* 損益グラフ */}
      {balanceHistory && balanceHistory.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-400">資産推移</h2>
          <PnlChart data={[...balanceHistory].reverse()} />
        </div>
      )}

      {/* 取引一覧 */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-400">全取引履歴</h2>
        {trades ? (
          <TradeTable trades={trades} />
        ) : (
          <p className="text-sm text-gray-500">取引履歴を読み込み中...</p>
        )}
      </div>
    </div>
  );
}
