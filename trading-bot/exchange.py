"""
取引所接続モジュール（Bybit）

paper モード: 実際の注文は出さず、残高・価格だけ取得して模擬取引
live  モード: 実際にBybit APIで注文を出す
"""
import ccxt
import pandas as pd
from loguru import logger
import config


class Exchange:
    def __init__(self):
        self.mode = config.TRADING_MODE
        self.exchange = ccxt.bybit({
            "apiKey": config.API_KEY,
            "secret": config.API_SECRET,
            "enableRateLimit": True,
            "options": {"defaultType": "spot"},
        })

        # paperモードは残高を模擬
        self._paper_balance = {"USDT": config.INITIAL_CAPITAL_USDT, "BTC": 0.0}

        if self.mode == "paper":
            logger.info(f"[PAPER MODE] 模擬取引モードで起動 (初期資金: {config.INITIAL_CAPITAL_USDT} USDT)")
        else:
            logger.warning("[LIVE MODE] 本番取引モードで起動 - 実際の資金が使われます！")

    def get_price(self, symbol: str = config.SYMBOL) -> float:
        """現在価格を取得"""
        ticker = self.exchange.fetch_ticker(symbol)
        return float(ticker["last"])

    def get_ohlcv(self, symbol: str = config.SYMBOL, timeframe: str = config.TIMEFRAME, limit: int = 100) -> pd.DataFrame:
        """OHLCVデータを取得"""
        raw = self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        return df

    def get_balance(self) -> dict:
        """残高取得"""
        if self.mode == "paper":
            return self._paper_balance.copy()
        balance = self.exchange.fetch_balance()
        return {
            "USDT": float(balance.get("USDT", {}).get("free", 0)),
            "BTC": float(balance.get("BTC", {}).get("free", 0)),
        }

    def place_order(self, side: str, amount: float, price: float = None) -> dict:
        """
        注文を出す

        Args:
            side: "buy" or "sell"
            amount: BTC数量
            price: 指値価格（Noneで成行）

        Returns:
            注文情報
        """
        order_type = "limit" if price else "market"
        symbol = config.SYMBOL

        if self.mode == "paper":
            exec_price = price or self.get_price()
            cost = exec_price * amount
            fee = cost * (config.MAKER_FEE if order_type == "limit" else config.TAKER_FEE)

            if side == "buy":
                if self._paper_balance["USDT"] < cost + fee:
                    logger.warning(f"[PAPER] 残高不足: 必要={cost + fee:.4f} USDT, 残高={self._paper_balance['USDT']:.4f} USDT")
                    return {}
                self._paper_balance["USDT"] -= (cost + fee)
                self._paper_balance["BTC"] += amount
            else:
                if self._paper_balance["BTC"] < amount:
                    logger.warning(f"[PAPER] BTC残高不足: 必要={amount:.6f}, 残高={self._paper_balance['BTC']:.6f}")
                    return {}
                self._paper_balance["BTC"] -= amount
                self._paper_balance["USDT"] += (cost - fee)

            logger.info(f"[PAPER] {side.upper()} {amount:.6f} BTC @ {exec_price:.2f} USDT (手数料: {fee:.4f} USDT)")
            logger.info(f"[PAPER] 残高: {self._paper_balance['USDT']:.4f} USDT, {self._paper_balance['BTC']:.6f} BTC")
            return {"id": "paper_order", "price": exec_price, "amount": amount, "side": side}

        # LIVE モード
        try:
            if order_type == "limit":
                order = self.exchange.create_limit_order(symbol, side, amount, price)
            else:
                order = self.exchange.create_market_order(symbol, side, amount)
            logger.info(f"[LIVE] 注文完了: {side} {amount} BTC @ {price or 'market'}")
            return order
        except ccxt.InsufficientFunds as e:
            logger.error(f"残高不足: {e}")
            return {}
        except Exception as e:
            logger.error(f"注文エラー: {e}")
            return {}

    def cancel_all_orders(self, symbol: str = config.SYMBOL):
        """全オープン注文をキャンセル"""
        if self.mode == "paper":
            logger.info("[PAPER] 全注文キャンセル（模擬）")
            return
        try:
            self.exchange.cancel_all_orders(symbol)
            logger.info("全注文キャンセル完了")
        except Exception as e:
            logger.error(f"注文キャンセルエラー: {e}")
