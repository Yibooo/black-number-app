"""
取引所ファクトリー（後方互換エイリアス）

config.EXCHANGE の値に応じて適切な取引所クラスを返す
"""
import config
from exchange_base import ExchangeBase


def Exchange() -> ExchangeBase:
    """
    設定に応じた取引所インスタンスを返すファクトリー関数

    EXCHANGE=gmo   → ExchangeGMO
    EXCHANGE=bybit → ExchangeBybit (デフォルト)
    """
    if config.EXCHANGE == "gmo":
        from exchange_gmo import ExchangeGMO
        return ExchangeGMO()
    else:
        from exchange_bybit import ExchangeBybit
        return ExchangeBybit()
