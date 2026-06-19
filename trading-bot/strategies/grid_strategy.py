"""
グリッドトレーディング戦略

仕組み:
- 現在価格の上下にグリッド（網の目）状に指値注文を配置
- 価格が下がるたびに買い、上がるたびに売る
- レンジ相場で安定して利益を積み上げる
"""
from dataclasses import dataclass, field
from typing import Optional
from loguru import logger
import config


@dataclass
class GridOrder:
    price: float
    side: str  # "buy" or "sell"
    size: float
    filled: bool = False
    order_id: Optional[str] = None


@dataclass
class GridStrategy:
    capital: float
    symbol: str = config.SYMBOL

    grid_orders: list = field(default_factory=list)
    base_price: float = 0.0
    total_pnl: float = 0.0

    def setup_grid(self, current_price: float) -> list[GridOrder]:
        """現在価格を基準にグリッドを設定"""
        self.base_price = current_price
        self.grid_orders = []

        grid_range = current_price * config.GRID_RANGE_PCT
        step = (grid_range * 2) / config.GRID_COUNT
        order_size_usdt = self.capital * config.GRID_ORDER_SIZE_PCT

        for i in range(config.GRID_COUNT // 2):
            # 買いグリッド（現在価格より下）
            buy_price = current_price - step * (i + 1)
            buy_size = order_size_usdt / buy_price
            self.grid_orders.append(GridOrder(
                price=round(buy_price, 2),
                side="buy",
                size=round(buy_size, 6)
            ))

            # 売りグリッド（現在価格より上）
            sell_price = current_price + step * (i + 1)
            sell_size = order_size_usdt / sell_price
            self.grid_orders.append(GridOrder(
                price=round(sell_price, 2),
                side="sell",
                size=round(sell_size, 6)
            ))

        logger.info(f"グリッド設定完了: 基準価格={current_price:.2f}, グリッド数={len(self.grid_orders)}")
        logger.info(f"  買いグリッド: {current_price - grid_range:.2f} ～ {current_price:.2f}")
        logger.info(f"  売りグリッド: {current_price:.2f} ～ {current_price + grid_range:.2f}")
        return self.grid_orders

    def check_filled_orders(self, current_price: float) -> list[GridOrder]:
        """約定したグリッド注文を確認し、対向注文を追加"""
        newly_filled = []

        for order in self.grid_orders:
            if order.filled:
                continue

            filled = (
                (order.side == "buy" and current_price <= order.price) or
                (order.side == "sell" and current_price >= order.price)
            )

            if filled:
                order.filled = True
                newly_filled.append(order)
                fee = order.price * order.size * config.MAKER_FEE

                if order.side == "buy":
                    pnl = -order.price * order.size - fee
                    logger.info(f"買い約定: {order.price:.2f} x {order.size:.6f} BTC (手数料: {fee:.4f} USDT)")
                else:
                    pnl = order.price * order.size - fee
                    logger.info(f"売り約定: {order.price:.2f} x {order.size:.6f} BTC (手数料: {fee:.4f} USDT)")

                self.total_pnl += pnl

        return newly_filled

    def needs_reset(self, current_price: float) -> bool:
        """価格がグリッド範囲外に出たらリセットが必要"""
        if self.base_price == 0:
            return True
        deviation = abs(current_price - self.base_price) / self.base_price
        return deviation > config.GRID_RANGE_PCT * 1.5
