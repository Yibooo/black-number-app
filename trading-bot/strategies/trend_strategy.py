"""
トレンドフォロー戦略（MA クロスオーバー + RSI）

仕組み:
- 短期MA が長期MA を上抜け → 買いシグナル（ゴールデンクロス）
- 短期MA が長期MA を下抜け → 売りシグナル（デッドクロス）
- RSI で過買い/過売りを確認してフィルタリング
"""
import pandas as pd
import numpy as np
from loguru import logger
import config


def calculate_signals(df: pd.DataFrame) -> pd.DataFrame:
    """
    OHLCVデータからシグナルを計算

    Args:
        df: columns=[timestamp, open, high, low, close, volume]

    Returns:
        signal列付きDataFrame: 1=買い, -1=売り, 0=ホールド
    """
    df = df.copy()

    # 移動平均
    df["ma_fast"] = df["close"].rolling(config.FAST_MA).mean()
    df["ma_slow"] = df["close"].rolling(config.SLOW_MA).mean()

    # RSI
    delta = df["close"].diff()
    gain = delta.where(delta > 0, 0).rolling(config.RSI_PERIOD).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(config.RSI_PERIOD).mean()
    rs = gain / loss.replace(0, np.inf)
    df["rsi"] = 100 - (100 / (1 + rs))

    # クロスオーバー検出
    df["cross"] = np.where(
        (df["ma_fast"] > df["ma_slow"]) & (df["ma_fast"].shift(1) <= df["ma_slow"].shift(1)), 1,
        np.where(
            (df["ma_fast"] < df["ma_slow"]) & (df["ma_fast"].shift(1) >= df["ma_slow"].shift(1)), -1,
            0
        )
    )

    # RSIフィルター適用
    df["signal"] = np.where(
        (df["cross"] == 1) & (df["rsi"] < config.RSI_OVERBOUGHT), 1,   # 買い
        np.where(
            (df["cross"] == -1) & (df["rsi"] > config.RSI_OVERSOLD), -1,  # 売り
            0
        )
    )

    return df


def get_current_signal(df: pd.DataFrame) -> int:
    """最新のシグナルを取得: 1=買い, -1=売り, 0=ホールド"""
    signals_df = calculate_signals(df)
    latest = signals_df.iloc[-1]

    if latest["signal"] == 1:
        logger.info(f"買いシグナル: MA({config.FAST_MA})={latest['ma_fast']:.2f} > MA({config.SLOW_MA})={latest['ma_slow']:.2f}, RSI={latest['rsi']:.1f}")
    elif latest["signal"] == -1:
        logger.info(f"売りシグナル: MA({config.FAST_MA})={latest['ma_fast']:.2f} < MA({config.SLOW_MA})={latest['ma_slow']:.2f}, RSI={latest['rsi']:.1f}")

    return int(latest["signal"])
