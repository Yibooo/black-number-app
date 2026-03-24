"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

type BalancePoint = {
  timestamp: number;
  pnlFromStart: number;
  totalJpy: number;
};

export default function PnlChart({ data }: { data: BalancePoint[] }) {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    pnl: Math.round(d.pnlFromStart),
    total: Math.round(d.totalJpy),
  }));

  const isPositive = (chartData.at(-1)?.pnl ?? 0) >= 0;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? "#4ade80" : "#f87171"}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? "#4ade80" : "#f87171"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `¥${v.toLocaleString()}`}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number) => [`¥${value.toLocaleString("ja-JP")}`, "損益"]}
        />
        <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke={isPositive ? "#4ade80" : "#f87171"}
          fill="url(#pnlGradient)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
