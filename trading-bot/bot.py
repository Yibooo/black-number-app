"""
メインボット: グリッド戦略 + トレンドフォロー の組み合わせ

戦略ロジック:
1. トレンド判定（MA クロス + RSI）
2. トレンド相場 → トレンドフォローで大きなポジションを持つ
3. レンジ相場  → グリッドで細かく利益を積み上げる
4. ストップロス / テイクプロフィットで資金を守る
"""
import time
import signal
import sys
from loguru import logger
from exchange import Exchange
from strategies import GridStrategy, get_current_signal
import config


class TradingBot:
    def __init__(self):
        self.exchange = Exchange()
        self.grid = None
        self.running = False
        self.cycle_count = 0
        self.start_balance_usdt = 0.0

        # Ctrl+C でクリーンシャットダウン
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

    def _shutdown(self, *args):
        logger.info("シャットダウン中...")
        self.running = False
        self.exchange.cancel_all_orders()
        self._print_summary()
        sys.exit(0)

    def _print_summary(self):
        balance = self.exchange.get_balance()
        price = self.exchange.get_price()
        total_usdt = balance["USDT"] + balance["BTC"] * price
        pnl = total_usdt - self.start_balance_usdt
        pnl_pct = (pnl / self.start_balance_usdt * 100) if self.start_balance_usdt > 0 else 0

        logger.info("=" * 50)
        logger.info(f"実行サイクル数: {self.cycle_count}")
        logger.info(f"現在価格: {price:.2f} USDT")
        logger.info(f"USDT残高: {balance['USDT']:.4f}")
        logger.info(f"BTC残高:  {balance['BTC']:.6f} ({balance['BTC'] * price:.4f} USDT相当)")
        logger.info(f"合計資産: {total_usdt:.4f} USDT")
        logger.info(f"損益:     {pnl:+.4f} USDT ({pnl_pct:+.2f}%)")
        logger.info("=" * 50)

    def _apply_stop_loss_take_profit(self, current_price: float, entry_price: float, position_btc: float) -> bool:
        """ストップロス・テイクプロフィットのチェック"""
        if position_btc <= 0 or entry_price <= 0:
            return False

        change_pct = (current_price - entry_price) / entry_price

        if change_pct <= -config.STOP_LOSS_PCT:
            logger.warning(f"ストップロス発動! 変化率={change_pct:.2%}")
            self.exchange.place_order("sell", position_btc)
            self.grid = None
            return True

        if change_pct >= config.TAKE_PROFIT_PCT:
            logger.info(f"テイクプロフィット発動! 変化率={change_pct:.2%}")
            self.exchange.place_order("sell", position_btc)
            self.grid = None
            return True

        return False

    def run(self):
        logger.info("トレーディングボット起動")
        logger.info(f"対象: {config.SYMBOL} | 戦略: グリッド + トレンドフォロー | モード: {config.TRADING_MODE.upper()}")

        balance = self.exchange.get_balance()
        self.start_balance_usdt = balance["USDT"] + balance["BTC"] * self.exchange.get_price()
        logger.info(f"初期資産: {self.start_balance_usdt:.4f} USDT")

        self.running = True
        entry_price = 0.0

        while self.running:
            try:
                self.cycle_count += 1
                current_price = self.exchange.get_price()
                balance = self.exchange.get_balance()
                df = self.exchange.get_ohlcv()

                logger.info(f"[Cycle {self.cycle_count}] 価格: {current_price:.2f} USDT | USDT: {balance['USDT']:.2f} | BTC: {balance['BTC']:.6f}")

                # ストップロス / テイクプロフィットチェック
                if self._apply_stop_loss_take_profit(current_price, entry_price, balance["BTC"]):
                    entry_price = 0.0
                    time.sleep(60)
                    continue

                # トレンドシグナル取得
                signal = get_current_signal(df)

                # グリッドのリセット判定
                if self.grid and self.grid.needs_reset(current_price):
                    logger.info("グリッドをリセット（価格がグリッド範囲外）")
                    self.exchange.cancel_all_orders()
                    self.grid = None

                # トレンドシグナルに応じた行動
                total_usdt = balance["USDT"] + balance["BTC"] * current_price

                if signal == 1 and balance["BTC"] * current_price < total_usdt * 0.3:
                    # 買いシグナル: 資金の30%をBTCで保有
                    buy_usdt = total_usdt * 0.30
                    buy_amount = buy_usdt / current_price
                    logger.info(f"トレンド買い: {buy_usdt:.2f} USDT 分のBTCを購入")
                    order = self.exchange.place_order("buy", buy_amount)
                    if order:
                        entry_price = current_price
                        self.grid = None  # グリッドをリセット

                elif signal == -1 and balance["BTC"] > 0:
                    # 売りシグナル: 全BTC売却
                    logger.info(f"トレンド売り: {balance['BTC']:.6f} BTC を売却")
                    self.exchange.place_order("sell", balance["BTC"])
                    entry_price = 0.0
                    self.grid = None

                else:
                    # シグナルなし: グリッドで稼ぐ
                    if not self.grid and balance["USDT"] > 10:
                        self.grid = GridStrategy(capital=balance["USDT"])
                        grid_orders = self.grid.setup_grid(current_price)
                        logger.info(f"グリッド設定: {len(grid_orders)}本の注文")

                    if self.grid:
                        filled = self.grid.check_filled_orders(current_price)
                        if filled:
                            logger.info(f"グリッド累計損益: {self.grid.total_pnl:+.4f} USDT")

                # 10サイクルごとにサマリー表示
                if self.cycle_count % 10 == 0:
                    self._print_summary()

                # 1時間足なので1時間待機（テスト時は短縮可）
                interval = 3600 if config.TIMEFRAME == "1h" else 60
                logger.info(f"次のチェックまで {interval}秒 待機...")
                time.sleep(interval)

            except Exception as e:
                logger.error(f"エラー発生: {e}")
                time.sleep(30)


if __name__ == "__main__":
    bot = TradingBot()
    bot.run()
