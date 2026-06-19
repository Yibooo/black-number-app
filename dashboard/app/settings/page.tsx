"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const config = useQuery(api.botConfig.get);
  const upsertConfig = useMutation(api.botConfig.upsert);

  const [form, setForm] = useState({
    gridCount: 10,
    gridRangePct: 0.10,
    gridOrderSizePct: 0.08,
    stopLossPct: 0.05,
    takeProfitPct: 0.10,
    fastMa: 9,
    slowMa: 21,
    rsiPeriod: 14,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) setForm({ ...config });
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* グリッド設定 */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 font-semibold">グリッド戦略</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="グリッド本数"
              name="gridCount"
              value={form.gridCount}
              onChange={(v) => setForm({ ...form, gridCount: Number(v) })}
              type="number"
              min={2}
              max={50}
            />
            <Field
              label="グリッド範囲（±%）"
              name="gridRangePct"
              value={(form.gridRangePct * 100).toFixed(1)}
              onChange={(v) => setForm({ ...form, gridRangePct: Number(v) / 100 })}
              type="number"
              step="0.1"
              min={1}
              max={50}
            />
            <Field
              label="1グリッド資金割合（%）"
              name="gridOrderSizePct"
              value={(form.gridOrderSizePct * 100).toFixed(1)}
              onChange={(v) => setForm({ ...form, gridOrderSizePct: Number(v) / 100 })}
              type="number"
              step="0.1"
              min={1}
              max={50}
            />
          </div>
        </div>

        {/* リスク管理 */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 font-semibold">リスク管理</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="ストップロス（%）"
              name="stopLossPct"
              value={(form.stopLossPct * 100).toFixed(1)}
              onChange={(v) => setForm({ ...form, stopLossPct: Number(v) / 100 })}
              type="number"
              step="0.1"
              min={0.1}
              max={50}
            />
            <Field
              label="テイクプロフィット（%）"
              name="takeProfitPct"
              value={(form.takeProfitPct * 100).toFixed(1)}
              onChange={(v) => setForm({ ...form, takeProfitPct: Number(v) / 100 })}
              type="number"
              step="0.1"
              min={0.1}
              max={100}
            />
          </div>
        </div>

        {/* トレンド設定 */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 font-semibold">トレンドフォロー（MA / RSI）</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="短期MA"
              name="fastMa"
              value={form.fastMa}
              onChange={(v) => setForm({ ...form, fastMa: Number(v) })}
              type="number"
              min={2}
              max={50}
            />
            <Field
              label="長期MA"
              name="slowMa"
              value={form.slowMa}
              onChange={(v) => setForm({ ...form, slowMa: Number(v) })}
              type="number"
              min={5}
              max={200}
            />
            <Field
              label="RSI期間"
              name="rsiPeriod"
              value={form.rsiPeriod}
              onChange={(v) => setForm({ ...form, rsiPeriod: Number(v) })}
              type="number"
              min={2}
              max={50}
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700 transition-colors"
        >
          {saved ? "保存しました ✓" : "設定を保存"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  ...props
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  [key: string]: unknown;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        {...props}
      />
    </div>
  );
}
