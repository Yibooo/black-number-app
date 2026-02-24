# 黒ナンバー書類自動生成アプリ 技術設計書

**作成日：** 2025年
**バージョン：** 1.0

---

## 1. 技術スタック選定

### 1.1 フロントエンド

| 技術 | 選定理由 |
|---|---|
| **Next.js 14（App Router）** | React ベースのフルスタックフレームワーク。SSR/CSR 両対応、Vercel との相性が最良 |
| **Tailwind CSS** | ユーティリティクラスで高速UI実装。レスポンシブ対応が容易 |
| **TypeScript** | 型安全。入力フォームのバリデーション定義と書類データモデルの整合性を保証 |
| **React Hook Form** | フォームバリデーションの実装が容易。パフォーマンスが高い |
| **Zod** | スキーマ定義とバリデーション。TypeScript と相性が良い |

### 1.2 PDF生成

| 技術 | 特徴 | 用途 |
|---|---|---|
| **pdf-lib**（推奨） | 既存PDFファイルに直接テキストを書き込める。行政様式PDFの座標指定で記入可能 | 行政指定フォームへの記入 |
| **@react-pdf/renderer** | React コンポーネントで PDF レイアウトを構築 | 独自フォーマットのPDF生成（運賃料金表など） |
| **puppeteer**（Phase 2以降） | Headless Chrome で HTML → PDF 変換 | 複雑なレイアウトへの対応 |

#### pdf-lib での座標指定方法
```typescript
import { PDFDocument, rgb } from 'pdf-lib';

// 行政様式の既存PDFを読み込み
const pdfBytes = await fetch('/templates/form1.pdf').then(r => r.arrayBuffer());
const pdfDoc = await PDFDocument.load(pdfBytes);
const page = pdfDoc.getPages()[0];

// 座標を指定してテキストを配置
page.drawText(applicantName, {
  x: 142,   // 横位置（ピクセル）
  y: 680,   // 縦位置（ピクセル）
  size: 11,
  color: rgb(0, 0, 0),
});
```

### 1.3 Excel出力

| 技術 | 選定理由 |
|---|---|
| **ExcelJS** | ブラウザ・Node.js 両対応。セル結合・スタイル設定が豊富 |
| **SheetJS（xlsx）** | 軽量。既存の Excel テンプレートへの書き込みが可能 |

### 1.4 バックエンド・サーバー

```
【重要ポイント】
このアプリは「サーバーレス構成」を推奨します。
理由：個人情報をサーバーに保存しないことでセキュリティリスクを最小化。
```

| 構成パターン | 技術 | 推奨度 |
|---|---|---|
| **フロントのみ（推奨/Phase1）** | Next.js + Vercel（静的ホスティング） | ⭐⭐⭐ シンプル・無料 |
| **サーバーレス関数** | Next.js API Routes + Vercel Functions | ⭐⭐⭐ PDF生成をサーバーサイドで処理 |
| **バックエンドAPI** | Node.js（Express/Fastify） + VPS | ⭐⭐ 将来のデータ保存・認証に対応 |

#### 推奨構成（Phase 1〜2）
```
[ユーザーのブラウザ]
    ↓ フォーム入力
[Next.js フロントエンド（Vercel）]
    ↓ PDF生成リクエスト
[Next.js API Route（Vercel Functions）]
    ↓ pdf-lib で処理
[PDF/Excel ファイル → ブラウザにダウンロード]
```

#### 将来構成（Phase 3〜4）
```
[ユーザーのブラウザ]
    ↓
[Next.js フロントエンド（Vercel）]
    ↓ API呼び出し
[バックエンド API（Node.js + Express）]
    ├── 郵便番号補完（zipcloud API）
    ├── OCR処理（Google Vision API）
    ├── PDF生成（pdf-lib / puppeteer）
    └── データ保存（PostgreSQL / Supabase）
```

### 1.5 OCR（Phase 3）

| 技術 | 精度 | コスト |
|---|---|---|
| **Google Cloud Vision API** | 高（日本語対応◎） | $1.50/1000枚 |
| **AWS Textract** | 高 | $1.50/1000枚 |
| **Tesseract.js** | 中（ブラウザ内処理） | 無料 |

---

## 2. ディレクトリ構成

```
black-number-app/
├── docs/
│   ├── requirements.md       # 要件定義書
│   └── technical-design.md   # 本ファイル
├── mvp/                      # Phase 1 MVP
│   ├── app/
│   │   ├── page.tsx          # トップページ（入力フォーム）
│   │   ├── preview/
│   │   │   └── page.tsx      # プレビュー画面
│   │   └── layout.tsx
│   ├── components/
│   │   ├── NameForm.tsx      # 名前入力フォーム
│   │   └── DocumentPreview.tsx # 書類プレビュー
│   ├── public/
│   │   └── templates/        # 行政様式PDFテンプレート
│   └── package.json
├── src/                      # Phase 2以降のメインアプリ
│   ├── app/
│   ├── components/
│   │   ├── forms/            # 入力フォームコンポーネント
│   │   └── documents/        # 書類プレビューコンポーネント
│   ├── lib/
│   │   ├── pdf-generator.ts  # PDF生成ロジック
│   │   ├── excel-generator.ts # Excel生成ロジック
│   │   ├── validators.ts     # バリデーションスキーマ
│   │   └── templates/        # 運賃テンプレート定義
│   └── types/
│       └── form-data.ts      # 入力データの型定義
└── README.md
```

---

## 3. データフロー

```
1. ユーザーがフォームに入力
        ↓
2. Zod スキーマでバリデーション（リアルタイム）
        ↓
3. FormData オブジェクトに集約
        ↓
4. 「書類生成」ボタン押下
        ↓
5. API Route（/api/generate）にPOST
        ↓
6. pdf-lib が行政様式PDFに座標指定でテキスト配置
   ExcelJS が Excelファイル生成
        ↓
7. バイナリデータをブラウザに返却
        ↓
8. ブラウザが自動ダウンロード
```

---

## 4. 型定義（TypeScript）

```typescript
// types/form-data.ts

export type ApplicantType = 'individual' | 'corporation';

export interface FormData {
  // 基本情報
  applicantType: ApplicantType;
  name: string;                    // 氏名または法人名
  representativeName?: string;     // 代表者名（法人のみ）
  postalCode: string;
  address: string;
  phone: string;

  // 営業所
  officeNameSameAsHome: boolean;
  officeName: string;
  officeAddress: string;

  // 車庫
  garageAttachedToOffice: boolean;
  garageAddress: string;
  garageCapacity: number;

  // 車両情報（複数台）
  vehicles: Vehicle[];

  // 安全管理者
  safetyManager: SafetyManager;

  // 事業情報
  businessStartDate: string;
  prefecture: string;

  // 運賃
  fareTemplate: 'amazon' | 'spot' | 'regular' | 'custom';
  fareSettings: FareSettings;
}

export interface Vehicle {
  plateNumber: string;      // 登録番号
  chassisNumber: string;    // 車台番号
  vehicleName: string;      // 車名
  model: string;            // 型式
  ownerName: string;        // 車検証の名義
}

export interface SafetyManager {
  name: string;
  birthDate: string;
  trainingCompletionDate: string;
  certificateNumber: string;
  trainingInstitution: string;
}

export interface FareSettings {
  distanceFareBase: number;       // 初乗り運賃
  distanceFareIncrement: number;  // 加算運賃
  timeFare: number;               // 時間制運賃
  waitingFee?: number;            // 待機料金
}
```

---

## 5. インフラ・デプロイ

### 推奨構成
```
ホスティング：Vercel（Next.js との公式対応、無料プランで十分）
ドメイン：独自ドメイン推奨（例：kuro-number-app.jp）
CI/CD：GitHub Actions → Vercel 自動デプロイ
```

### コスト試算（月次）
| 項目 | 無料プラン | 有料プラン |
|---|---|---|
| Vercel ホスティング | 無料（100GB転送量まで） | $20/月〜 |
| PDF生成 | ブラウザ内処理なら無料 | — |
| OCR（Google Vision） | 1000枚/月 無料 | $1.50/1000枚 |
| データベース（Supabase） | 500MB 無料 | $25/月〜 |

**Phase 1〜2は完全無料で運用可能。**

---

## 6. セキュリティ設計

- 個人情報はブラウザのメモリのみに保持（localStorage 非使用）
- API Routes は PDF 生成のみ担当。個人情報をログに残さない
- HTTPS 強制（Vercel デフォルト）
- Phase 4でユーザー認証追加時は NextAuth.js を使用
- 入力データの暗号化保存は AES-256 を使用予定

---

## 7. 技術的な難易度評価

| 機能 | 難易度 | 必要スキル |
|---|---|---|
| フォームUI | 低 | React, Tailwind CSS |
| フォームバリデーション | 低 | React Hook Form, Zod |
| PDF座標指定での記入 | 中 | pdf-lib、行政様式のピクセル座標調査 |
| Excel出力 | 低〜中 | ExcelJS |
| 郵便番号自動補完 | 低 | zipcloud API |
| 車検証OCR | 高 | Google Vision API, 画像前処理 |
| 認証・データ保存 | 中 | NextAuth.js, Supabase |

**最大の技術課題は「PDF座標指定」：** 行政様式の各入力欄の正確なピクセル座標を1つ1つ調査・定義する必要がある。
