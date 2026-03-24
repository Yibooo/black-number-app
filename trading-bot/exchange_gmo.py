"""
GMO Coin 取引所モジュール

paper モード: 実際の注文は出さず、残高・価格だけ取得して模擬取引
live  モード: 実際に GMO Coin API で注文を出す

GMO Coin API ドキュメント: https://api.coin.z.com/docs/
"""
import hashlib
import hmac
import time
from datetime import datetime, timezone

import pandas as pd
import requests
from loguru import logger

import config
from exchange_base import ExchangeBase

BASE_URL = "https://api.coin.z.com"
_INTERVAL_MAP = {
    "1m": "1min",
    "5m": "5min",
    "10m": "10min",
    "15m": "15min",
    "30m": "30min",
    "1h": "1hour",
    "4h": "4hour",
    "8h": "8hour",
    "1d": "1day",
    "1w": "1week",
    "1M": "1month",
}
# GMO Coin のシンボル形式 "BTC/JPY" → "BTC_JPY"
_SYMBOL_MAP = {
    "BTC/JPY": "BTC_JPY",
    "ETH/JPY": "ETH_JPY",
    "XRP/JPY": "XRP_JPY",
    "BTC/USDT": "BTC",  # USDT建てはスポットシンボル "BTC" を使用
}


def _to_gmo_symbol(symbol: str) -> str:
    return _SYMBOL_MAP.get(symbol, symbol.replace("/", "_"))


class ExchangeGMO(ExchangeBase):
    """GMO Coin 取引所"""

    def __init__(self):
        self.mode = config.TRADING_MODE
        self.api_key = config.API_KEY
        self.api_secret = config.API_SECRET
        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

        # paper モードは残高を模擬（円建て）
        self._paper_balance = {
            "JPY": config.INITIAL_CAPITAL_JPY,
            "BTC": 0.0,
        }

        if self.mode == "paper":
            logger.info(f"[GMO/PAPER] 模擬取引モードで起動 (初期資金: {config.INITIAL_CAPITAL_JPY:,.0f} 円)")
        else:
            logger.warning("[GMO/LIVE] 本番取引モードで起動 - 実際の資金が使われます！")

    # ──────────────────────────────────────────
    # 認証
    # ──────────────────────────────────────────

    def _sign(self, timestamp: str, method: str, path: str, body: str = "") -> str:
        message = timestamp + method + path + body
        return hmac.new(
            self.api_secret.encode(), message.encode(), hashlib.sha256
        ).hexdigest()

    def _private_headers(self, method: str, path: str, body: str = "") -> dict:
        ts = str(int(time.time() * 1000))
        return {
            "API-KEY": self.api_key,
            "API-TIMESTAMP": ts,
            "API-SIGN": self._sign(ts, method, path, body),
        }

    # ──────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────

    def get_price(self, symbol: str = config.SYMBOL) -> float:
        """現在価格を取得"""
        gmo_sym = _to_gmo_symbol(symbol)
        res = self._session.get(f"{BASE_URL}/public/v1/ticker", params={"symbol": gmo_sym})
        res.raise_for_status()
        data = res.json()
        if data["status"] != 0:
            raise RuntimeError(f"GMO API error: {data}")
        last = float(data["data"][0]["last"])
        return last

    def get_ohlcv(
        self,
        symbol: str = config.SYMBOL,
        timeframe: str = config.TIMEFRAME,
        limit: int = 100,
    ) -> pd.DataFrame:
        """OHLCVデータを取得"""
        gmo_sym = _to_gmo_symbol(symbol)
        interval = _INTERVAL_MAP.get(timeframe, "1hour")

        # GMO Coin の klines は date 指定が必要 (YYYYMMDD)
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        res = self._session.get(
            f"{BASE_URL}/public/v1/klines",
            params={"symbol": gmo_sym, "interval": interval, "date": today},
        )
        res.raise_for_status()
        data = res.json()
        if data["status"] != 0:
            raise RuntimeError(f"GMO klines API error: {data}")

        rows = data["data"]
        df = pd.DataFrame(rows, columns=["openTime", "open", "high", "low", "close", "volume"])
        df = df.rename(columns={"openTime": "timestamp"})
        df["timestamp"] = pd.to_datetime(df["timestamp"].astype(int), unit="ms")
        for col in ["open", "high", "low", "close", "volume"]:
            df[col] = df[col].astype(float)

        return df.tail(limit).reset_index(drop=True)

    # ──────────────────────────────────────────
    # Private API
    # ──────────────────────────────────────────

    def get_balance(self) -> dict:
        """残高取得 {"JPY": float, "BTC": float}"""
        if self.mode == "paper":
            return self._paper_balance.copy()

        path = "/private/v1/account/assets"
        headers = self._private_headers("GET", path)
        res = self._session.get(BASE_URL + path, headers=headers)
        res.raise_for_status()
        data = res.json()
        if data["status"] != 0:
            raise RuntimeError(f"GMO assets API error: {data}")

        result = {"JPY": 0.0, "BTC": 0.0}
        for item in data["data"]:
            sym = item["symbol"]
            if sym == "JPY":
                result["JPY"] = float(item["available"])
            elif sym == "BTC":
                result["BTC"] = float(item["available"])
        return result

    def place_order(self, side: str, amount: float, price: float = None) -> dict:
        """
        注文を出す

        Args:
            side: "buy" or "sell"
            amount: BTC数量
            price: 指値価格（Noneで成行）

        Returns:
            注文情報 dict
        """
        order_type = "LIMIT" if price else "MARKET"
        gmo_sym = _to_gmo_symbol(config.SYMBOL)

        if self.mode == "paper":
            exec_price = price or self.get_price()
            cost = exec_price * amount
            fee_rate = config.MAKER_FEE if order_type == "LIMIT" else config.TAKER_FEE
            fee = cost * fee_rate

            if side == "buy":
                if self._paper_balance["JPY"] < cost + fee:
                    logger.warning(
                        f"[GMO/PAPER] 残高不足: 必要={cost + fee:,.0f} JPY, "
                        f"残高={self._paper_balance['JPY']:,.0f} JPY"
                    )
                    return {}
                self._paper_balance["JPY"] -= cost + fee
                self._paper_balance["BTC"] += amount
            else:
                if self._paper_balance["BTC"] < amount:
                    logger.warning(
                        f"[GMO/PAPER] BTC残高不足: 必要={amount:.6f}, "
                        f"残高={self._paper_balance['BTC']:.6f}"
                    )
                    return {}
                self._paper_balance["BTC"] -= amount
                self._paper_balance["JPY"] += cost - fee

            logger.info(
                f"[GMO/PAPER] {side.upper()} {amount:.6f} BTC @ {exec_price:,.0f} JPY "
                f"(手数料: {fee:,.0f} JPY)"
            )
            logger.info(
                f"[GMO/PAPER] 残高: {self._paper_balance['JPY']:,.0f} JPY, "
                f"{self._paper_balance['BTC']:.6f} BTC"
            )
            return {"id": "paper_order", "price": exec_price, "amount": amount, "side": side}

        # LIVE モード
        path = "/private/v1/order"
        body_dict = {
            "symbol": gmo_sym,
            "side": "BUY" if side == "buy" else "SELL",
            "executionType": order_type,
            "size": str(amount),
        }
        if price:
            body_dict["price"] = str(int(price))

        import json
        body = json.dumps(body_dict)
        headers = self._private_headers("POST", path, body)
        try:
            res = self._session.post(BASE_URL + path, headers=headers, data=body)
            res.raise_for_status()
            data = res.json()
            if data["status"] != 0:
                logger.error(f"[GMO/LIVE] 注文エラー: {data}")
                return {}
            order_id = data["data"]
            logger.info(f"[GMO/LIVE] 注文完了: {side} {amount} BTC @ {price or 'market'} (ID: {order_id})")
            return {"id": order_id, "price": price, "amount": amount, "side": side}
        except requests.exceptions.HTTPError as e:
            logger.error(f"[GMO/LIVE] HTTP エラー: {e}")
            return {}
        except Exception as e:
            logger.error(f"[GMO/LIVE] 注文エラー: {e}")
            return {}

    def cancel_all_orders(self, symbol: str = config.SYMBOL) -> None:
        """全オープン注文をキャンセル"""
        if self.mode == "paper":
            logger.info("[GMO/PAPER] 全注文キャンセル（模擬）")
            return

        gmo_sym = _to_gmo_symbol(symbol)
        path = "/private/v1/activeOrders"
        headers = self._private_headers("GET", path)

        try:
            res = self._session.get(
                BASE_URL + path,
                params={"symbol": gmo_sym, "page": 1, "count": 100},
                headers=headers,
            )
            res.raise_for_status()
            data = res.json()
            if data["status"] != 0:
                logger.error(f"[GMO/LIVE] 有効注文取得エラー: {data}")
                return

            orders = data.get("data", {}).get("list", [])
            for order in orders:
                self._cancel_order(order["orderId"])
            logger.info(f"[GMO/LIVE] {len(orders)}件の注文をキャンセル完了")
        except Exception as e:
            logger.error(f"[GMO/LIVE] 注文キャンセルエラー: {e}")

    def _cancel_order(self, order_id: str) -> None:
        import json
        path = "/private/v1/cancelOrder"
        body = json.dumps({"orderId": order_id})
        headers = self._private_headers("POST", path, body)
        res = self._session.post(BASE_URL + path, headers=headers, data=body)
        res.raise_for_status()
