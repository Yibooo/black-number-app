"""
取引所基底クラス

全取引所実装はこのクラスを継承する
"""
from abc import ABC, abstractmethod
import pandas as pd


class ExchangeBase(ABC):
    """取引所インターフェース"""

    @abstractmethod
    def get_price(self, symbol: str) -> float:
        """現在価格を取得"""
        ...

    @abstractmethod
    def get_ohlcv(self, symbol: str, timeframe: str, limit: int) -> pd.DataFrame:
        """OHLCVデータを取得 (columns: timestamp, open, high, low, close, volume)"""
        ...

    @abstractmethod
    def get_balance(self) -> dict:
        """残高取得 {"JPY": float, "BTC": float}"""
        ...

    @abstractmethod
    def place_order(self, side: str, amount: float, price: float = None) -> dict:
        """注文発注 side="buy"|"sell", amount=BTC数量, price=指値(Noneで成行)"""
        ...

    @abstractmethod
    def cancel_all_orders(self, symbol: str) -> None:
        """全オープン注文をキャンセル"""
        ...
