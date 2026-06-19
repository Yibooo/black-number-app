"""
Convex HTTP クライアント

BOT の状態・取引履歴・残高を Convex に送信する
Convex の HTTP Actions を呼び出す
"""
import time
from typing import Optional

import requests
from loguru import logger

import config


class ConvexClient:
    """Convex HTTP API クライアント"""

    def __init__(self):
        self.url = config.CONVEX_URL.rstrip("/")
        self.enabled = bool(self.url)
        if not self.enabled:
            logger.info("[Convex] CONVEX_URL が未設定のため Convex 連携は無効")

    def _post(self, action: str, payload: dict) -> bool:
        """Convex HTTP Action を呼び出す"""
        if not self.enabled:
            return False
        try:
            res = requests.post(
                f"{self.url}/api/action",
                json={"path": action, "args": payload},
                timeout=5,
            )
            res.raise_for_status()
            return True
        except Exception as e:
            logger.warning(f"[Convex] 送信失敗 ({action}): {e}")
            return False

    def record_trade(
        self,
        side: str,
        price: float,
        amount: float,
        pnl: float,
        strategy: str,
        order_id: str = "",
    ) -> bool:
        """取引履歴を保存"""
        return self._post("trades:recordTrade", {
            "timestamp": int(time.time() * 1000),
            "symbol": config.SYMBOL,
            "side": side,
            "price": price,
            "amount": amount,
            "cost": price * amount,
            "fee": price * amount * (config.MAKER_FEE if strategy == "grid" else config.TAKER_FEE),
            "pnl": pnl,
            "strategy": strategy,
            "exchange": config.EXCHANGE,
            "orderId": order_id,
        })

    def record_balance(
        self,
        jpy: float,
        btc: float,
        btc_price: float,
        pnl_from_start: float,
    ) -> bool:
        """残高スナップショットを保存"""
        btc_value = btc * btc_price
        return self._post("balances:recordBalance", {
            "timestamp": int(time.time() * 1000),
            "jpy": jpy,
            "btc": btc,
            "btcValueJpy": btc_value,
            "totalJpy": jpy + btc_value,
            "pnlFromStart": pnl_from_start,
        })

    def update_bot_status(
        self,
        running: bool,
        cycle_count: int,
        error_message: Optional[str] = None,
    ) -> bool:
        """BOT 稼働状態を更新"""
        return self._post("botStatus:updateStatus", {
            "running": running,
            "mode": config.TRADING_MODE,
            "exchange": config.EXCHANGE,
            "symbol": config.SYMBOL,
            "cycleCount": cycle_count,
            "lastHeartbeat": int(time.time() * 1000),
            "errorMessage": error_message,
        })
