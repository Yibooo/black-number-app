type HighlightType = "positive" | "negative" | undefined;

export default function BalanceCard({
  title,
  value,
  sub,
  highlight,
}: {
  title: string;
  value: string;
  sub?: string;
  highlight?: HighlightType;
}) {
  const valueColor =
    highlight === "positive"
      ? "text-green-400"
      : highlight === "negative"
      ? "text-red-400"
      : "text-white";

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
