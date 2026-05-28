"""
Negotiation strategies for buyer and seller agents.
Each strategy determines how an agent makes/responds to offers over rounds.

Strategies available:
  boulware     — slow conceder, protects target price until deadline
  conceder     — fast early concessions, buyer-friendly for quick closure
  tit_for_tat  — mirrors opponent, cooperative but firm (reciprocal concession)
  hardball     — barely concedes, monopoly/high-demand sellers
  aspirational — Indian bazaar style: anchors high then quick goodwill drop
  realistic    — no-nonsense MSME: starts at midpoint, linear to floor

New features (v3):
  - urgency_level: urgent buyers concede faster (beta multiplier)
  - Reciprocal concession: TitForTat + Realistic detect opponent's concession pace
  - Final offer signaling: round >= max-1 sets is_final=True on offer
  - Anti-injection: _sanitize_for_llm() cleans all strings before LLM prompt use
  - Circuit breaker: after 3 Ollama failures, skip for 5 minutes
  - LLM response parsing fix: pick nearest-to-midpoint number within valid range
"""
from __future__ import annotations

import asyncio
import re
import time
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


# ── Urgency concession multiplier ────────────────────────────────────────────
# Urgent buyers concede faster; cautious buyers hold out longer.
URGENCY_BETA_MULTIPLIER = {
    "low":    1.4,   # slower concessions, patient
    "normal": 1.0,   # baseline
    "high":   0.75,  # faster concessions
    "urgent": 0.5,   # very fast — deadline pressure
}


# ── Anti-injection sanitizer ──────────────────────────────────────────────────

def _sanitize_for_llm(text: str, max_len: int = 40) -> str:
    """
    Remove characters that could carry prompt injection payloads.
    Keeps only: a-z A-Z 0-9 space _ / -
    Truncates to max_len to bound prompt size.
    """
    cleaned = re.sub(r'[^a-zA-Z0-9 _/\-]', '', str(text))
    return cleaned[:max_len].strip()


# ── Offer dataclass ───────────────────────────────────────────────────────────

@dataclass
class Offer:
    price: float
    quantity: int
    delivery_days: int
    payment_term: str
    round_number: int
    from_agent: str   # agent ID
    is_final: bool = False  # True when round >= max_rounds - 1


# ── ZOPA (Zone of Possible Agreement) helpers ─────────────────────────────────

def zopa_exists(buyer_max: float, seller_floor: float) -> bool:
    """True if a deal is theoretically possible."""
    return buyer_max >= seller_floor


def zopa_midpoint(buyer_max: float, seller_floor: float, buyer_target: float) -> float:
    """Compromise price: weighted toward buyer (buyer gets 60% of the gap)."""
    if not zopa_exists(buyer_max, seller_floor):
        return seller_floor
    gap = buyer_max - seller_floor
    return round(seller_floor + gap * 0.40, 2)   # buyer keeps 60% savings


# ── Circuit breaker for Ollama ────────────────────────────────────────────────

_ollama_consecutive_failures: int = 0
_ollama_skip_until: float = 0.0          # unix timestamp
_OLLAMA_FAILURE_THRESHOLD: int = 3
_OLLAMA_COOLDOWN_SECONDS: float = 300.0  # 5 minutes


def _circuit_open() -> bool:
    """Returns True if Ollama circuit breaker is tripped (skip LLM)."""
    return time.time() < _ollama_skip_until


def _record_llm_success() -> None:
    global _ollama_consecutive_failures
    _ollama_consecutive_failures = 0


def _record_llm_failure() -> None:
    global _ollama_consecutive_failures, _ollama_skip_until
    _ollama_consecutive_failures += 1
    if _ollama_consecutive_failures >= _OLLAMA_FAILURE_THRESHOLD:
        _ollama_skip_until = time.time() + _OLLAMA_COOLDOWN_SECONDS
        logger.warning(
            "Ollama circuit breaker OPEN after %d failures — skipping for %.0f s",
            _ollama_consecutive_failures, _OLLAMA_COOLDOWN_SECONDS,
        )


# ── LLM hook (Ollama) ─────────────────────────────────────────────────────────

# Global LLM concurrency cap: max 2 simultaneous Ollama calls to avoid queuing
_llm_semaphore: Optional[asyncio.Semaphore] = None
_llm_semaphore_lock: Optional[asyncio.Lock] = None


def _get_llm_semaphore() -> asyncio.Semaphore:
    global _llm_semaphore
    if _llm_semaphore is None:
        _llm_semaphore = asyncio.Semaphore(2)
    return _llm_semaphore


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
    model: str = "qwen2.5-coder:7b",
) -> tuple[Optional[float], int]:
    """
    Ask Ollama to suggest a compromise price.
    Returns (suggested_price, tokens_used) or (None, 0) on failure/unavailable.
    Only called post-loop when a ZOPA exists but rounds exhausted.

    v3 improvements:
    - Circuit breaker: skip if 3 consecutive failures
    - Anti-injection: sanitize category before inserting into prompt
    - Smarter parsing: pick number nearest to midpoint within [floor, buyer_max]
    """
    if _circuit_open():
        logger.debug("Ollama circuit breaker open — skipping LLM call")
        return None, 0

    try:
        import httpx
        import asyncio as _asyncio

        # Anti-injection: sanitize category before inserting into prompt
        safe_category = _sanitize_for_llm(category, max_len=30)

        # Ultra-compact prompt: minimise tokens for fast CPU inference
        prompt = (
            f"B2B price deal ({safe_category}). "
            f"Min=Rs.{seller_floor:.0f} Max=Rs.{buyer_max:.0f}. "
            f"Reply with ONE fair price number only."
        )

        sem = _get_llm_semaphore()
        async with sem:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await _asyncio.wait_for(
                    client.post(
                        "http://localhost:11434/api/generate",
                        json={
                            "model": model,
                            "prompt": prompt,
                            "stream": False,
                            "options": {"num_predict": 12, "temperature": 0.0},
                        },
                    ),
                    timeout=15.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    text = data.get("response", "").strip()
                    tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)

                    # v3 FIX: don't just take first number — pick nearest to midpoint
                    # within [seller_floor, buyer_max]. Avoids picking % values like "10.0"
                    raw_numbers = re.findall(r'\d+\.?\d*', text)
                    valid_prices = [
                        float(n) for n in raw_numbers
                        if seller_floor <= float(n) <= buyer_max
                    ]
                    if valid_prices:
                        midpoint = (seller_floor + buyer_max) / 2
                        price = min(valid_prices, key=lambda x: abs(x - midpoint))
                        _record_llm_success()
                        return round(price, 2), tokens

    except Exception as exc:
        logger.debug("Ollama unavailable/timeout: %s", exc)
        _record_llm_failure()

    return None, 0


# ── Base strategy class ───────────────────────────────────────────────────────

class NegotiationStrategy:
    """
    Base class for all negotiation strategies.

    v3: Each strategy can accept urgency_level at construction and adjusts
    its beta (concession speed) accordingly.
    """

    def __init__(self, urgency_level: str = "normal"):
        self.urgency_level = urgency_level
        self._urgency_multiplier = URGENCY_BETA_MULTIPLIER.get(urgency_level, 1.0)
        self._prev_opponent_price: Optional[float] = None  # for reciprocal concession

    def make_offer(
        self,
        round_num: int,
        max_rounds: int,
        own_floor: float,   # buyer: target_price; seller: floor_price
        own_target: float,  # buyer: max_budget;   seller: list_price
        last_opponent_offer: Optional[Offer],
    ) -> float:
        raise NotImplementedError

    def accept_offer(self, offer: Offer, floor_price: float) -> bool:
        """Return True if the offer should be accepted."""
        return offer.price >= floor_price

    def _get_opponent_concession(self, last_opponent_offer: Optional[Offer]) -> float:
        """
        Returns opponent's last concession magnitude as a fraction.
        Positive = they moved toward our side. Used for reciprocal response.
        """
        if last_opponent_offer is None or self._prev_opponent_price is None:
            return 0.0
        delta = abs(last_opponent_offer.price - self._prev_opponent_price)
        base = max(self._prev_opponent_price, 1.0)
        return delta / base

    def _update_prev_opponent(self, last_opponent_offer: Optional[Offer]) -> None:
        if last_opponent_offer is not None:
            self._prev_opponent_price = last_opponent_offer.price


# ── Boulware ──────────────────────────────────────────────────────────────────

class BoulwareStrategy(NegotiationStrategy):
    """
    Starts close to target, concedes very slowly — big concession only near deadline.
    Typical for sellers with strong floor prices or scarce inventory.
    v3: urgency multiplier applied to beta.
    """

    def make_offer(self, round_num, max_rounds, own_floor, own_target, last_opponent_offer):
        base_beta = 3.5   # high = very slow (Indian sellers are stubborn!)
        beta = base_beta * self._urgency_multiplier
        t = round_num / max_rounds
        concession_factor = t ** beta
        price = own_target - (own_target - own_floor) * concession_factor
        return round(max(own_floor, min(own_target, price)), 2)


# ── Conceder ──────────────────────────────────────────────────────────────────

class ConcederStrategy(NegotiationStrategy):
    """
    Rapid concessions early → slows down. Buyers who want quick closure.

    v3 FIX: For buyers, the strategy moves from buyer_max DOWN to buyer_target.
    Protocol passes (own_floor=buyer_target, own_target=buyer_max).
    The conceder formula naturally does: price goes from buyer_max → buyer_target.
    Protocol skips rounds where buyer_price < adjusted_floor, so conceder buyers
    still participate in early rounds (when price is high) and fall through to
    ZOPA/LLM for the final resolution. This is correct behavior.

    urgency multiplier: urgent buyers concede faster (lower beta = faster curve).
    """

    def make_offer(self, round_num, max_rounds, own_floor, own_target, last_opponent_offer):
        base_beta = 0.25   # fast early drop (concave curve)
        beta = base_beta * self._urgency_multiplier
        # Clamp urgency-adjusted beta: don't go below 0.05 (too extreme)
        beta = max(0.05, beta)
        t = round_num / max_rounds
        concession_factor = t ** beta
        price = own_target - (own_target - own_floor) * concession_factor
        return round(max(own_floor, min(own_target, price)), 2)


# ── TitForTat (v3: reciprocal concession) ────────────────────────────────────

class TitForTatStrategy(NegotiationStrategy):
    """
    Mirrors the opponent's concession rate. Cooperative but firm.

    v3 improvements:
    - Reciprocal concession detection: if opponent conceded ≥3%, mirror with 60% response.
      If opponent held firm (≤0.5%), hold own position.
    - Urgency multiplier: urgent agents mirror more aggressively (120% of opponent move).
    - BUG FIX (carried over): offers clamped to [own_floor, own_target] — no price escalation.
    """

    def make_offer(self, round_num, max_rounds, own_floor, own_target, last_opponent_offer):
        if round_num == 1 or last_opponent_offer is None:
            self._update_prev_opponent(last_opponent_offer)
            return round(own_target, 2)

        if round_num == 2:
            self._update_prev_opponent(last_opponent_offer)
            # Small goodwill concession: 3% toward floor
            price = own_target - (own_target - own_floor) * 0.03
            return round(max(own_floor, min(own_target, price)), 2)

        # Reciprocal concession detection
        opp_concession = self._get_opponent_concession(last_opponent_offer)
        my_gap = own_target - own_floor

        if opp_concession >= 0.03:
            # Opponent moved significantly — respond with 60% of their move
            # Urgent agents respond more generously (80%)
            response_ratio = 0.80 if self.urgency_level in ("high", "urgent") else 0.60
            move = my_gap * response_ratio * opp_concession / max(opp_concession, 0.001)
            move = min(move, my_gap * 0.10)  # cap single-round move at 10% of gap
            mirrored = own_target - move
        elif opp_concession <= 0.005:
            # Opponent held firm — hold our position (no move this round)
            mirrored = own_target - (own_target - own_floor) * 0.02 * (round_num - 1)
        else:
            # Moderate opponent move: mirror at 0.985 (slight concession)
            mirrored = last_opponent_offer.price * 0.985

        # CRITICAL: clamp within [own_floor, own_target]
        price = max(own_floor, min(own_target, mirrored))
        self._update_prev_opponent(last_opponent_offer)
        return round(price, 2)


# ── Hardball ──────────────────────────────────────────────────────────────────

class HardballStrategy(NegotiationStrategy):
    """
    Barely concedes — only 8% total across all rounds.
    Used by monopoly sellers or products with no substitutes.
    v3: urgency multiplier (urgent buyers in hardball mode concede slightly more).
    """

    def make_offer(self, round_num, max_rounds, own_floor, own_target, last_opponent_offer):
        # urgency makes hardball slightly less hard for buyers
        max_concession_pct = 0.08 + (0.04 * (1.0 - self._urgency_multiplier))
        max_total_concession = (own_target - own_floor) * max_concession_pct
        t = round_num / max_rounds
        price = own_target - max_total_concession * (t ** 3.0)   # super slow
        return round(max(own_floor, min(own_target, price)), 2)


# ── Aspirational (Indian bazaar style) ────────────────────────────────────────

class AspirationalStrategy(NegotiationStrategy):
    """
    Anchors high (own_target × 1.15 for sellers), then drops 10% quickly to show
    goodwill, then Boulware-style slow concession toward floor.
    Mimics classic Indian bazaar anchoring-then-generosity pattern.
    For BUYERS: starts 15% below target then moves up quickly then slows.
    v3: urgency multiplier on Boulware phase beta.
    """

    def make_offer(self, round_num, max_rounds, own_floor, own_target, last_opponent_offer):
        anchor = own_target * 1.15   # start 15% above target (as seller)
        # cap anchor at something reasonable
        anchor = min(anchor, own_target + (own_target - own_floor) * 0.3)
        if round_num == 1:
            return round(min(anchor, own_target * 1.12), 2)
        if round_num <= 3:
            # Quick 8-10% drop to show goodwill
            drop_pct = 0.10 * (round_num - 1) / 2
            price = own_target * (1 + 0.12 * (1 - drop_pct))
            return round(max(own_floor, min(own_target * 1.05, price)), 2)
        # Boulware from own_target onward (urgency-adjusted)
        base_beta = 3.0
        beta = base_beta * self._urgency_multiplier
        t = (round_num - 3) / max(max_rounds - 3, 1)
        concession_factor = t ** beta
        price = own_target - (own_target - own_floor) * concession_factor
        return round(max(own_floor, min(own_target, price)), 2)


# ── Realistic (time-pressed MSME) ─────────────────────────────────────────────

class RealisticStrategy(NegotiationStrategy):
    """
    Starts at midpoint of (floor, target), moves linearly to floor.
    No games — just steady, predictable concessions.
    For Indian MSMEs who are too busy to play long negotiation games.

    v3: Reciprocal concession detection — if opponent concedes, move a bit extra.
    Urgency: faster linear descent when urgent.
    """

    def make_offer(self, round_num, max_rounds, own_floor, own_target, last_opponent_offer):
        # Start at 60% of the gap between floor and target
        start = own_floor + (own_target - own_floor) * 0.60
        # Urgency adjusts the linear descent speed
        speed = 1.0 / self._urgency_multiplier  # urgent = faster (>1.0)
        t = min(1.0, (round_num / max_rounds) * speed)
        price = start - (start - own_floor) * t

        # Reciprocal concession: if opponent moved significantly, add a goodwill bump
        opp_concession = self._get_opponent_concession(last_opponent_offer)
        if opp_concession >= 0.03 and round_num >= 2:
            extra_move = (own_target - own_floor) * 0.04  # extra 4% goodwill
            price -= extra_move  # concede a bit more toward floor

        self._update_prev_opponent(last_opponent_offer)
        return round(max(own_floor, min(own_target, price)), 2)


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
    """Get a strategy instance with the given urgency level."""
    cls = STRATEGY_MAP.get(name, BoulwareStrategy)
    return cls(urgency_level=urgency_level)
