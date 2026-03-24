"""
トレーディングボット設定
"""
import os
from dotenv import load_dotenv

load_dotenv()

# API設定
API_KEY = os.getenv("BYBIT_API_KEY", "")
API_SECRET = os.getenv("BYBIT_API_SECRET", "")
TRADING_MODE = os.getenv("TRADING_MODE", "paper")  # paper or live

# 取引設定
SYMBOL = os.getenv("SYMBOL", "BTC/USDT")
TIMEFRAME = "1h"  # 1時間足

# 初期資金（USDT換算、1万円 ≈ 65 USDT）
INITIAL_CAPITAL_USDT = float(os.getenv("INITIAL_CAPITAL", "65"))

# リスク管理
MAX_POSITION_PCT = 0.95    # 資金の最大95%まで使う
STOP_LOSS_PCT = 0.05       # 5%下落でストップロス
TAKE_PROFIT_PCT = 0.10     # 10%上昇でテイクプロフィット

# グリッド戦略設定
GRID_COUNT = 10            # グリッド本数
GRID_RANGE_PCT = 0.10      # 上下±10%の範囲にグリッドを配置
GRID_ORDER_SIZE_PCT = 0.08 # 1グリッドあたり資金の8%

# トレンドフォロー設定
FAST_MA = 9                # 短期移動平均
SLOW_MA = 21               # 長期移動平均
RSI_PERIOD = 14
RSI_OVERSOLD = 30          # RSI 30以下で買いシグナル
RSI_OVERBOUGHT = 70        # RSI 70以上で売りシグナル

# 手数料（Bybit Maker: 0.01%, Taker: 0.06%）
MAKER_FEE = 0.0001
TAKER_FEE = 0.0006
