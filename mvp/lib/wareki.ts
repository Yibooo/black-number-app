// 西暦(YYYY-MM-DD)を和暦文字列に変換するユーティリティ。
// 黒ナンバー届出書類は和暦（令和等）で記入するため。

interface Era {
  name: string;
  startYear: number; // 元号開始の西暦年
  startMonth: number;
  startDay: number;
}

// 直近の元号のみ対応（実務上、届出書は現行元号で記入）
const ERAS: Era[] = [
  { name: '令和', startYear: 2019, startMonth: 5, startDay: 1 },
  { name: '平成', startYear: 1989, startMonth: 1, startDay: 8 },
  { name: '昭和', startYear: 1926, startMonth: 12, startDay: 25 },
];

export function toWareki(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  for (const era of ERAS) {
    const afterStart =
      y > era.startYear ||
      (y === era.startYear && (m > era.startMonth || (m === era.startMonth && d >= era.startDay)));
    if (afterStart) {
      const eraYear = y - era.startYear + 1;
      const yearLabel = eraYear === 1 ? '元' : String(eraYear);
      return `${era.name}${yearLabel}年${m}月${d}日`;
    }
  }
  return `${y}年${m}月${d}日`;
}
