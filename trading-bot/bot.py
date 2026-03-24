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
from convex_client import ConvexClient
import config


class TradingBot:
    def __init__(self):
        self.exchange = Exchange()
        self.convex = ConvexClient()
        self.grid = None
        self.running = False
        self.cycle_count = 0
        self.start_balance = 0.0  # JPY or USDT

        # Ctrl+C でクリーンシャットダウン
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

    def _shutdown(self, *args):
        logger.info("シャットダウン中...")
        self.running = False
        self.exchange.cancel_all_orders(config.SYMBOL)
        self.convex.update_bot_status(running=False, cycle_count=self.cycle_count)
        self._print_summary()
        sys.exit(0)

    def _get_total_value(self, balance: dict, price: float) -> float:
        """総資産を計算（JPY建て or USDT建て）"""
        if config.EXCHANGE == "gmo":
            return balance.get("JPY", 0) + balance.get("BTC", 0) * price
        else:
            return balance.get("USDT", 0) + balance.get("BTC", 0) * price

    def _get_base_currency(self) -> str:
        return "JPY" if config.EXCHANGE == "gmo" else "USDT"

    def _print_summary(self):
        balance = self.exchange.get_balance()
        price = self.exchange.get_price(config.SYMBOL)
        total = self._get_total_value(balance, price)
        pnl = total - self.start_balance
        pnl_pct = (pnl / self.start_balance * 100) if self.start_balance > 0 else 0
        currency = self._get_base_currency()

        logger.info("=" * 50)
        logger.info(f"実行サイクル数: {self.cycle_count}")
        logger.info(f"現在価格: {price:,.0f} {currency}")
        logger.info(f"{currency}残高: {balance.get(currency, 0):,.4f}")
        logger.info(f"BTC残高:  {balance.get('BTC', 0):.6f} ({balance.get('BTC', 0) * price:,.0f} {currency}相当)")
        logger.info(f"合計資産: {total:,.4f} {currency}")
        logger.info(f"損益:     {pnl:+,.4f} {currency} ({pnl_pct:+.2f}%)")
        logger.info("=" * 50)

        # Convex に残高を記録
        jpy = balance.get("JPY", total) if config.EXCHANGE == "gmo" else total
        self.convex.record_balance(
            jpy=jpy,
            btc=balance.get("BTC", 0),
            btc_price=price,
            pnl_from_start=pnl,
        )

    def _apply_stop_loss_take_profit(
        self, current_price: float, entry_price: float, position_btc: float
    ) -> bool:
        """ストップロス・テイクプロフィットのチェック"""
        if position_btc <= 0 or entry_price <= 0:
            return False

        change_pct = (current_price - entry_price) / entry_price

        if change_pct <= -config.STOP_LOSS_PCT:
            logger.warning(f"ストップロス発動! 変化率={change_pct:.2%}")
            order = self.exchange.place_order("sell", position_btc)
            if order:
                pnl = (current_price - entry_price) * position_btc
                self.convex.record_trade("sell", current_price, position_btc, pnl, "trend")
            self.grid = None
            return True

        if change_pct >= config.TAKE_PROFIT_PCT:
            logger.info(f"テイクプロフィット発動! 変化率={change_pct:.2%}")
            order = self.exchange.place_order("sell", position_btc)
            if order:
                pnl = (current_price - entry_price) * position_btc
                self.convex.record_trade("sell", current_price, position_btc, pnl, "trend")
            self.grid = None
            return True

        return False

    def run(self):
        logger.info("トレーディングボット起動")
        logger.info(
            f"取引所: {config.EXCHANGE.upper()} | 対象: {config.SYMBOL} | "
            f"戦略: グリッド + トレンドフォロー | モード: {config.TRADING_MODE.upper()}"
        )

        balance = self.exchange.get_balance()
        price = self.exchange.get_price(config.SYMBOL)
        self.start_balance = self._get_total_value(balance, price)
        logger.info(f"初期資産: {self.start_balance:,.4f} {self._get_base_currency()}")

        self.running = True
        self.convex.update_bot_status(running=True, cycle_count=0)
        entry_price = 0.0

        while self.running:
            try:
                self.cycle_count += 1
                current_price = self.exchange.get_price(config.SYMBOL)
                balance = self.exchange.get_balance()
                df = self.exchange.get_ohlcv(config.SYMBOL, config.TIMEFRAME)
                currency = self._get_base_currency()

                btc = balance.get("BTC", 0)
                base = balance.get(currency, 0)
                logger.info(
                    f"[Cycle {self.cycle_count}] 価格: {current_price:,.0f} {currency} | "
                    f"{currency}: {base:,.2f} | BTC: {btc:.6f}"
                )

                # ストップロス / テイクプロフィットチェック
                if self._apply_stop_loss_take_profit(current_price, entry_price, btc):
                    entry_price = 0.0
                    time.sleep(60)
                    continue

                # トレンドシグナル取得
                trade_signal = get_current_signal(df)

                # グリッドのリセット判定
                if self.grid and self.grid.needs_reset(current_price):
                    logger.info("グリッドをリセット（価格がグリッド範囲外）")
                    self.exchange.cancel_all_orders(config.SYMBOL)
                    self.grid = None

                # トレンドシグナルに応じた行動
                total = self._get_total_value(balance, current_price)

                if trade_signal == 1 and btc * current_price < total * 0.3:
                    # 買いシグナル: 資金の30%をBTCで保有
                    buy_value = total * 0.30
                    buy_amount = buy_value / current_price
                    logger.info(f"トレンド買い: {buy_value:,.0f} {currency} 分のBTCを購入")
                    order = self.exchange.place_order("buy", buy_amount)
                    if order:
                        entry_price = current_price
                        self.convex.record_trade("buy", current_price, buy_amount, 0.0, "trend")
                        self.grid = None

                elif trade_signal == -1 and btc > 0:
                    # 売りシグナル: 全BTC売却
                    logger.info(f"トレンド売り: {btc:.6f} BTC を売却")
                    order = self.exchange.place_order("sell", btc)
                    if order:
                        pnl = (current_price - entry_price) * btc if entry_price > 0 else 0
                        self.convex.record_trade("sell", current_price, btc, pnl, "trend")
                    entry_price = 0.0
                    self.grid = None

                else:
                    # シグナルなし: グリッドで稼ぐ
                    if not self.grid and base > 10:
                        self.grid = GridStrategy(capital=base)
                        grid_orders = self.grid.setup_grid(current_price)
                        logger.info(f"グリッド設定: {len(grid_orders)}本の注文")

                    if self.grid:
                        filled = self.grid.check_filled_orders(current_price)
                        for order in filled:
                            pnl_per = order.price * order.size if order.side == "sell" else -order.price * order.size
                            self.convex.record_trade(order.side, order.price, order.size, pnl_per, "grid")
                        if filled:
                            logger.info(f"グリッド累計損益: {self.grid.total_pnl:+,.4f} {currency}")

                # Convex にハートビート送信
                self.convex.update_bot_status(running=True, cycle_count=self.cycle_count)

                # 10サイクルごとにサマリー表示
                if self.cycle_count % 10 == 0:
                    self._print_summary()

                # 1時間足なので1時間待機（テスト時は短縮可）
                interval = 3600 if config.TIMEFRAME == "1h" else 60
                logger.info(f"次のチェックまで {interval}秒 待機...")
                time.sleep(interval)

            except Exception as e:
                logger.error(f"エラー発生: {e}")
                self.convex.update_bot_status(
                    running=True,
                    cycle_count=self.cycle_count,
                    error_message=str(e),
                )
                time.sleep(30)


if __name__ == "__main__":
    bot = TradingBot()
    bot.run()
