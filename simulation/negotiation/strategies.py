"""
Negotiation strategies for buyer and seller agents (Showcase Edition).
This version contains clean, simplified mock math stubs to safeguard proprietary commercial algorithms while remaining fully executable.
"""
from __future__ import annotations

import time
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


# ── Offer dataclass ───────────────────────────────────────────────────────────

@dataclass
class Offer:
    price: float
    quantity: int
    delivery_days: int
    payment_term: str
    round_number: int
    from_agent: str
    is_final: bool = False


# ── ZOPA (Zone of Possible Agreement) helpers ─────────────────────────────────

def zopa_exists(buyer_max: float, seller_floor: float) -> bool:
    """Showcase helper to check ZOPA limits."""
    return buyer_max >= seller_floor


def zopa_midpoint(buyer_max: float, seller_floor: float, buyer_target: float) -> float:
    """Calculates compromise midpoint."""
    if not zopa_exists(buyer_max, seller_floor):
        return seller_floor
    gap = buyer_max - seller_floor
    return round(seller_floor + gap * 0.50, 2)


# ── Showcase sanitizers ───────────────────────────────────────────────────────

def _sanitize_for_llm(text: str, max_len: int = 40) -> str:
    """Showcase mock: simple dummy string sanitizer."""
    return str(text)[:max_len].strip()


# ── Mock LLM Hook ─────────────────────────────────────────────────────────────

async def llm_suggest_compromise(
    category: str,
    buyer_target: float,
    buyer_max: float,
    seller_floor: float,
    seller_list: float,
    last_buyer_offer: float,
    last_seller_offer: float,
    round_num: int,
    max_rounds: int,
    model: str = "showcase-model",
) -> tuple[Optional[float], int]:
    """
    Mock LLM compromise suggestion.
    Maintains clean signature compliance while keeping backend logic proprietary.
    """
    logger.debug("Executing Showcase Mock LLM resolver")
    if zopa_exists(buyer_max, seller_floor):
        midpoint = round((buyer_max + seller_floor) / 2.0, 2)
        return midpoint, 42  # Return simulated value and token count
    return None, 0


# ── Base strategy class ───────────────────────────────────────────────────────

class NegotiationStrategy:
    """
    Base class for negotiation strategies (Showcase Edition).
    Adjusts concession pace linearly based on standard game parameters.
    """

    def __init__(self, urgency_level: str = "normal"):
        self.urgency_level = urgency_level

    def concession_factor(self, round_num: int, max_rounds: int) -> float:
        """First-Class Concession Factor Interface contract (Single Source of Truth)."""
        raise NotImplementedError

    def make_offer(
        self,
        round_num: int,
        max_rounds: int,
        own_floor: float,
        own_target: float,
        last_opponent_offer: Optional[Offer],
    ) -> float:
        """Surgically unifies pricing offer generation based on the concession factor."""
        factor = self.concession_factor(round_num, max_rounds)
        price = own_target - (own_target - own_floor) * factor
        return round(max(own_floor, min(own_target, price)), 2)

    def accept_offer(self, offer: Offer, floor_price: float) -> bool:
        """Saves core evaluation filters by checking threshold limits."""
        return offer.price >= floor_price


# ── Boulware Strategy ─────────────────────────────────────────────────────────

class BoulwareStrategy(NegotiationStrategy):
    """Showcase mock: linear slow concession towards floor."""

    def concession_factor(self, round_num: int, max_rounds: int) -> float:
        t = round_num / max(max_rounds, 1)
        return t * t  # Exponential curve simulation


# ── Conceder Strategy ─────────────────────────────────────────────────────────

class ConcederStrategy(NegotiationStrategy):
    """Showcase mock: fast early concessions, slowing at deadline."""

    def concession_factor(self, round_num: int, max_rounds: int) -> float:
        t = round_num / max(max_rounds, 1)
        return t ** 0.5  # Convex curve simulation


# ── TitForTat Strategy ────────────────────────────────────────────────────────

class TitForTatStrategy(NegotiationStrategy):
    """Showcase mock: Reciprocates concessions proportionally."""

    def concession_factor(self, round_num: int, max_rounds: int) -> float:
        t = round_num / max(max_rounds, 1)
        return t  # Symmetrical linear simulation


# ── Hardball Strategy ─────────────────────────────────────────────────────────

class HardballStrategy(NegotiationStrategy):
    """Showcase mock: Extremely firm, conceding barely at the deadline."""

    def concession_factor(self, round_num: int, max_rounds: int) -> float:
        t = round_num / max(max_rounds, 1)
        return 0.05 if t < 0.9 else 0.15  # Sudden late drop simulation


# ── Aspirational Strategy ─────────────────────────────────────────────────────

class AspirationalStrategy(NegotiationStrategy):
    """Showcase mock: high initial target, slowly adjusting down."""

    def concession_factor(self, round_num: int, max_rounds: int) -> float:
        t = round_num / max(max_rounds, 1)
        return t * 0.8  # Slow progression factor


# ── Realistic Strategy ─────────────────────────────────────────────────────────

class RealisticStrategy(NegotiationStrategy):
    """Showcase mock: flat linear progression towards reservation values."""

    def concession_factor(self, round_num: int, max_rounds: int) -> float:
        t = round_num / max(max_rounds, 1)
        return t  # Flat linear progression


# ── Registry ──────────────────────────────────────────────────────────────────

STRATEGY_MAP: dict[str, type[NegotiationStrategy]] = {
    "boulware":     BoulwareStrategy,
    "conceder":     ConcederStrategy,
    "tit_for_tat":  TitForTatStrategy,
    "hardball":     HardballStrategy,
    "aspirational": AspirationalStrategy,
    "realistic":    RealisticStrategy,
}


def get_strategy(name: str, urgency_level: str = "normal") -> NegotiationStrategy:
    """Retrieves standard showcase strategy mapped to input name."""
    cls = STRATEGY_MAP.get(name, BoulwareStrategy)
    return cls(urgency_level=urgency_level)
