type Trade = {
  _id: string;
  timestamp: number;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  cost: number;
  pnl: number;
  strategy: "grid" | "trend" | "manual";
};

export default function TradeTable({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return <p className="text-sm text-gray-500">取引履歴がありません</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs text-gray-500">
            <th className="pb-2 pr-4">日時</th>
            <th className="pb-2 pr-4">売買</th>
            <th className="pb-2 pr-4 text-right">価格</th>
            <th className="pb-2 pr-4 text-right">数量 (BTC)</th>
            <th className="pb-2 pr-4 text-right">金額</th>
            <th className="pb-2 pr-4 text-right">損益</th>
            <th className="pb-2 text-right">戦略</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="py-2 pr-4 text-gray-400">
                {new Date(t.timestamp).toLocaleString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    t.side === "buy"
                      ? "bg-blue-900/50 text-blue-400"
                      : "bg-orange-900/50 text-orange-400"
                  }`}
                >
                  {t.side === "buy" ? "買" : "売"}
                </span>
              </td>
              <td className="py-2 pr-4 text-right">
                ¥{t.price.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}
              </td>
              <td className="py-2 pr-4 text-right">{t.amount.toFixed(6)}</td>
              <td className="py-2 pr-4 text-right">
                ¥{t.cost.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}
              </td>
              <td
                className={`py-2 pr-4 text-right font-medium ${
                  t.pnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {t.pnl >= 0 ? "+" : ""}¥
                {t.pnl.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}
              </td>
              <td className="py-2 text-right">
                <span className="rounded px-1.5 py-0.5 text-xs text-gray-500 border border-gray-700">
                  {t.strategy}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
