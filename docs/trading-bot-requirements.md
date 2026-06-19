# 自動売買BOT + 管理ダッシュボード 要件定義書

## 1. プロジェクト概要

GMO コインを取引所として使用する自動売買BOTと、その稼働状況・取引履歴をリアルタイムで確認・操作できるWeb管理ダッシュボードを開発する。

---

## 2. システム構成

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel                                 │
│   Next.js ダッシュボード（管理UI）                           │
│   ├── リアルタイム残高・損益表示                             │
│   ├── 取引履歴一覧                                          │
│   └── BOT制御（起動/停止/設定）                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ Convex Realtime Sync
┌─────────────────────▼───────────────────────────────────────┐
│                    Convex                                    │
│   ├── trades テーブル（取引履歴）                            │
│   ├── balances テーブル（残高スナップショット）               │
│   ├── bot_status テーブル（稼働状態）                        │
│   └── bot_config テーブル（設定）                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Mutation API
┌─────────────────────▼───────────────────────────────────────┐
│           Trading Bot（Python / Railway）                    │
│   ├── bot.py（メインループ）                                 │
│   ├── exchange_gmo.py（GMO Coin API）                       │
│   ├── exchange_bybit.py（Bybit API / 既存）                  │
│   └── strategies/（グリッド + トレンド）                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────────┐
│                  GMO Coin API                                │
│   ├── Public API（価格・板情報）                             │
│   └── Private API（残高・注文・約定履歴）                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 技術スタック

| レイヤー | 技術 | 理由 |
|----------|------|------|
| フロントエンド | Next.js 14 + Tailwind CSS + TypeScript | 既存 mvp と同じ技術 |
| バックエンド/DB | **Convex** | mission-control で既に使用中 |
| ホスティング（UI） | Vercel | 既存 mvp と同じ |
| BOT実行環境 | Railway（Python 3.11） | 24時間稼働・無料枠あり |
| 取引所 | **GMO Coin**（メイン）/ Bybit（既存） | 国内取引所・円建て対応 |

---

## 4. 機能要件

### 4.1 取引BOT

#### GMO Coin API 対応
- [ ] Public API: 現在価格取得（`/public/v1/ticker`）
- [ ] Public API: OHLCVデータ取得（`/public/v1/klines`）
- [ ] Private API: 残高取得（`/private/v1/account/assets`）
- [ ] Private API: 注文発注（`/private/v1/order`）
- [ ] Private API: 注文キャンセル（`/private/v1/cancelOrder`）
- [ ] HMAC-SHA256 署名認証
- [ ] レートリミット対応（GMO Coin: 1req/300ms）

#### 取引戦略（既存維持）
- [ ] グリッドトレーディング（レンジ相場）
- [ ] トレンドフォロー（MA クロス + RSI）
- [ ] ストップロス / テイクプロフィット

#### Convex 連携
- [ ] サイクルごとに残高スナップショットを保存
- [ ] 約定時に取引履歴を保存
- [ ] BOT起動/停止時にステータスを更新
- [ ] 設定をConvexから読み取り（動的設定変更対応）

### 4.2 管理ダッシュボード

#### ダッシュボード画面
- [ ] 現在の残高（円建て・BTC）
- [ ] 本日の損益 / 累計損益
- [ ] 現在のBTC価格（リアルタイム更新）
- [ ] BOT稼働状態（起動中/停止/エラー）
- [ ] 直近の取引履歴（最新10件）

#### 取引履歴画面
- [ ] 全取引の一覧表示（日時・売買・価格・数量・損益）
- [ ] 損益グラフ（累計）
- [ ] フィルタ（日付範囲・売買種別）

#### BOT制御画面
- [ ] 起動 / 停止ボタン
- [ ] 緊急全決済ボタン（確認ダイアログあり）
- [ ] 設定変更フォーム
  - グリッド本数
  - ストップロス / テイクプロフィット率
  - 1グリッドあたりの資金割合
  - 取引シンボル切替

---

## 5. 非機能要件

| 項目 | 要件 |
|------|------|
| リアルタイム性 | Convex のリアルタイム購読で 1秒以内に UI 反映 |
| セキュリティ | APIキーは環境変数で管理、Convex には保存しない |
| 可用性 | BOT は Railway の自動再起動で常時稼働 |
| ペーパーモード | TRADING_MODE=paper でリスクなく動作確認可能 |

---

## 6. Convex スキーマ設計

```typescript
// convex/schema.ts

trades: {
  timestamp: number,       // Unix ms
  symbol: string,          // "BTC_JPY"
  side: "buy" | "sell",
  price: number,
  amount: number,          // BTC数量
  cost: number,            // 約定金額（円）
  fee: number,
  pnl: number,             // この取引の損益
  strategy: "grid" | "trend" | "manual",
  exchange: "gmo" | "bybit",
  orderId: string,
}

balances: {
  timestamp: number,
  jpy: number,
  btc: number,
  btcValueJpy: number,
  totalJpy: number,
  pnlFromStart: number,
}

bot_status: {
  running: boolean,
  mode: "paper" | "live",
  exchange: "gmo" | "bybit",
  symbol: string,
  cycleCount: number,
  lastHeartbeat: number,
  errorMessage?: string,
}

bot_config: {
  gridCount: number,
  gridRangePct: number,
  gridOrderSizePct: number,
  stopLossPct: number,
  takeProfitPct: number,
  fastMa: number,
  slowMa: number,
  rsiPeriod: number,
}
```

---

## 7. 開発フェーズ

| フェーズ | 内容 | ブランチ |
|----------|------|----------|
| **Phase 1** | 要件定義・設計 | `claude/automated-trading-bot-tedTw` |
| **Phase 2** | GMO Coin exchange 実装 + exchange抽象化 | 同上 |
| **Phase 3** | Convex スキーマ + BOT → Convex 連携 | 同上 |
| **Phase 4** | Next.js 管理ダッシュボード実装 | 同上 |
| **Phase 5** | Railway / Vercel デプロイ設定 | 同上 |

---

## 8. GMO Coin API メモ

| エンドポイント | 用途 |
|-------------|------|
| `GET /public/v1/ticker?symbol=BTC` | 現在価格 |
| `GET /public/v1/klines?symbol=BTC&interval=1hour&limit=100` | OHLCV |
| `GET /private/v1/account/assets` | 残高 |
| `POST /private/v1/order` | 注文 |
| `POST /private/v1/cancelOrder` | 注文キャンセル |
| `GET /private/v1/activeOrders` | 有効注文一覧 |
| `GET /private/v1/latestExecutions` | 最新約定履歴 |

- ベースURL: `https://api.coin.z.com`
- 認証: `API-KEY` + `API-TIMESTAMP` + `API-SIGN`（HMAC-SHA256）
- レートリミット: Private API は 300ms に 1リクエスト

---

## 9. ディレクトリ構成（最終形）

```
black-number-app/
├── docs/
│   ├── requirements.md              # 黒ナンバーアプリ要件定義
│   ├── technical-design.md          # 黒ナンバー技術設計
│   └── trading-bot-requirements.md  # ← 本ドキュメント
├── mvp/                             # 黒ナンバーアプリ（既存）
├── trading-bot/                     # 自動売買BOT
│   ├── exchange_base.py             # 抽象基底クラス
│   ├── exchange_gmo.py              # GMO Coin 実装
│   ├── exchange_bybit.py            # Bybit 実装（既存リファクタ）
│   ├── exchange.py                  # 後方互換 alias
│   ├── bot.py                       # メインループ
│   ├── config.py                    # 設定
│   ├── convex_client.py             # Convex HTTP API クライアント
│   ├── requirements.txt
│   └── strategies/
│       ├── __init__.py
│       ├── grid_strategy.py
│       └── trend_strategy.py
└── dashboard/                       # 管理ダッシュボード（新規）
    ├── convex/                      # Convex スキーマ・関数
    │   ├── schema.ts
    │   ├── trades.ts
    │   ├── balances.ts
    │   ├── botStatus.ts
    │   └── botConfig.ts
    ├── app/
    │   ├── page.tsx                 # ダッシュボード
    │   ├── trades/page.tsx          # 取引履歴
    │   └── settings/page.tsx        # 設定
    ├── components/
    │   ├── BalanceCard.tsx
    │   ├── PnlChart.tsx
    │   ├── TradeTable.tsx
    │   ├── BotStatusBadge.tsx
    │   └── BotControls.tsx
    └── package.json
```
