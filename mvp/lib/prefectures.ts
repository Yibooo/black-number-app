// 都道府県 → 管轄運輸支局名のマッピング。
// 宛名「○○運輸支局長 殿」の自動補完に使う。
// 注: 北海道など一部は複数の運輸支局があり、主要支局を既定とした。
//     沖縄は陸運事務所。提出前に管轄を必ず確認すること。

export interface Prefecture {
  code: string; // 都道府県コード
  name: string; // 表示名（○○都/道/府/県）
  office: string; // 宛名に入る運輸支局名（「長 殿」を除く部分）
}

export const PREFECTURES: Prefecture[] = [
  { code: 'hokkaido', name: '北海道', office: '札幌運輸支局' },
  { code: 'aomori', name: '青森県', office: '青森運輸支局' },
  { code: 'iwate', name: '岩手県', office: '岩手運輸支局' },
  { code: 'miyagi', name: '宮城県', office: '宮城運輸支局' },
  { code: 'akita', name: '秋田県', office: '秋田運輸支局' },
  { code: 'yamagata', name: '山形県', office: '山形運輸支局' },
  { code: 'fukushima', name: '福島県', office: '福島運輸支局' },
  { code: 'ibaraki', name: '茨城県', office: '茨城運輸支局' },
  { code: 'tochigi', name: '栃木県', office: '栃木運輸支局' },
  { code: 'gunma', name: '群馬県', office: '群馬運輸支局' },
  { code: 'saitama', name: '埼玉県', office: '埼玉運輸支局' },
  { code: 'chiba', name: '千葉県', office: '千葉運輸支局' },
  { code: 'tokyo', name: '東京都', office: '東京運輸支局' },
  { code: 'kanagawa', name: '神奈川県', office: '神奈川運輸支局' },
  { code: 'niigata', name: '新潟県', office: '新潟運輸支局' },
  { code: 'toyama', name: '富山県', office: '富山運輸支局' },
  { code: 'ishikawa', name: '石川県', office: '石川運輸支局' },
  { code: 'fukui', name: '福井県', office: '福井運輸支局' },
  { code: 'yamanashi', name: '山梨県', office: '山梨運輸支局' },
  { code: 'nagano', name: '長野県', office: '長野運輸支局' },
  { code: 'gifu', name: '岐阜県', office: '岐阜運輸支局' },
  { code: 'shizuoka', name: '静岡県', office: '静岡運輸支局' },
  { code: 'aichi', name: '愛知県', office: '愛知運輸支局' },
  { code: 'mie', name: '三重県', office: '三重運輸支局' },
  { code: 'shiga', name: '滋賀県', office: '滋賀運輸支局' },
  { code: 'kyoto', name: '京都府', office: '京都運輸支局' },
  { code: 'osaka', name: '大阪府', office: '大阪運輸支局' },
  { code: 'hyogo', name: '兵庫県', office: '兵庫運輸支局' },
  { code: 'nara', name: '奈良県', office: '奈良運輸支局' },
  { code: 'wakayama', name: '和歌山県', office: '和歌山運輸支局' },
  { code: 'tottori', name: '鳥取県', office: '鳥取運輸支局' },
  { code: 'shimane', name: '島根県', office: '島根運輸支局' },
  { code: 'okayama', name: '岡山県', office: '岡山運輸支局' },
  { code: 'hiroshima', name: '広島県', office: '広島運輸支局' },
  { code: 'yamaguchi', name: '山口県', office: '山口運輸支局' },
  { code: 'tokushima', name: '徳島県', office: '徳島運輸支局' },
  { code: 'kagawa', name: '香川県', office: '香川運輸支局' },
  { code: 'ehime', name: '愛媛県', office: '愛媛運輸支局' },
  { code: 'kochi', name: '高知県', office: '高知運輸支局' },
  { code: 'fukuoka', name: '福岡県', office: '福岡運輸支局' },
  { code: 'saga', name: '佐賀県', office: '佐賀運輸支局' },
  { code: 'nagasaki', name: '長崎県', office: '長崎運輸支局' },
  { code: 'kumamoto', name: '熊本県', office: '熊本運輸支局' },
  { code: 'oita', name: '大分県', office: '大分運輸支局' },
  { code: 'miyazaki', name: '宮崎県', office: '宮崎運輸支局' },
  { code: 'kagoshima', name: '鹿児島県', office: '鹿児島運輸支局' },
  { code: 'okinawa', name: '沖縄県', office: '沖縄総合事務局 陸運事務所' },
];

const BY_CODE = new Map(PREFECTURES.map((p) => [p.code, p]));

export function getPrefecture(code: string): Prefecture | undefined {
  return BY_CODE.get(code);
}

// 「○○運輸支局長　殿」形式の宛名を返す（陸運事務所は「長　殿」）
export function officeAddressLine(code: string): string {
  const p = BY_CODE.get(code);
  if (!p) return '';
  return `${p.office}長　殿`;
}
