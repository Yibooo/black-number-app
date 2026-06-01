import type { FareSettings, FareTemplateId } from '@/types/form-data';

// 運賃テンプレート。金額は例示であり、実際の運賃は事業者が自由に設定できる。
// docs/forms/03-unchin-hyo.md のテンプレート表に対応。

export interface FareTemplate {
  id: FareTemplateId;
  label: string;
  description: string;
  settings: FareSettings | null; // custom は手動入力のため null
}

export const FARE_TEMPLATES: FareTemplate[] = [
  {
    id: 'amazon',
    label: 'AmazonFlex向け標準',
    description: 'Amazon配送パートナー想定',
    settings: { distanceFareBase: 800, distanceFareIncrement: 200, timeFare: 4000, waitingFee: 500 },
  },
  {
    id: 'spot',
    label: '軽貨物スポット向け',
    description: '単発配送・マッチングアプリ想定',
    settings: { distanceFareBase: 700, distanceFareIncrement: 180, timeFare: 3500, waitingFee: 400 },
  },
  {
    id: 'regular',
    label: '定期便向け',
    description: '固定取引先との定期契約想定',
    settings: { distanceFareBase: 0, distanceFareIncrement: 0, timeFare: 3800, waitingFee: 450 },
  },
  {
    id: 'custom',
    label: 'カスタム（手動入力）',
    description: '金額を自分で設定',
    settings: null,
  },
];

export function getFareTemplate(id: FareTemplateId): FareTemplate | undefined {
  return FARE_TEMPLATES.find((t) => t.id === id);
}
