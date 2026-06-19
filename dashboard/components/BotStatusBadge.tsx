type BotStatus = {
  running: boolean;
  mode: "paper" | "live";
  exchange: "gmo" | "bybit";
  symbol: string;
  cycleCount: number;
  lastHeartbeat: number;
  errorMessage?: string;
};

export default function BotStatusBadge({ status }: { status: BotStatus }) {
  const isAlive = Date.now() - status.lastHeartbeat < 5 * 60 * 1000; // 5分以内
  const alive = status.running && isAlive;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2">
      <span
        className={`h-2 w-2 rounded-full ${alive ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
      />
      <span className="text-sm font-medium">
        {alive ? "稼働中" : "停止中"}
      </span>
      <span className="text-xs text-gray-500">
        {status.exchange.toUpperCase()} / {status.symbol} / {status.mode.toUpperCase()}
      </span>
      <span className="text-xs text-gray-600">Cycle {status.cycleCount}</span>
      {status.errorMessage && (
        <span className="rounded bg-red-900/50 px-2 py-0.5 text-xs text-red-400">
          {status.errorMessage.slice(0, 40)}
        </span>
      )}
    </div>
  );
}
