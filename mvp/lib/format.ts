// 金額を「1,234円」形式に整形。0や別途協議の扱いを共通化。
export function yen(value: number): string {
  if (!value || value <= 0) return '別途協議';
  return `${value.toLocaleString('ja-JP')}円`;
}
