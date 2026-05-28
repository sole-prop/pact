"""
BuyerAgent: Represents a buyer MSME.
Orchestrates parallel negotiations with all eligible sellers,
collects results, and returns a ranked top-10 shortlist.

v3 upgrades:
  - Two-pass BATNA: quick 3-round pre-screen of first 5 sellers to compute
    a BATNA price, then full 10-round negotiation for all sellers with BATNA context
  - Sentinel integration: optional SentinelAgent passed to monitor_deal() after
    each negotiation completes
  - allow_moq_waiver: passes MOQ-close sellers to protocol (not hard-filtered)
  - urgency_level: urgent buyers accept price premium for fast delivery
  - allow_partial_fulfillment: accept partial stock delivery
  - max_moq_premium_pct: max extra % buyer pays for MOQ waiver
  - negotiation_strategy: boulware/conceder/tit_for_tat/hardball/aspirational/realistic
"""
import asyncio
from dataclasses import dataclass, field
from typing import Optional, TYPE_CHECKING

from simulation.agents.seller_agent import SellerAgent
from simulation.negotiation.protocols import NegotiationSession, run_negotiation
from simulation.negotiation.ranking import NegotiatedDeal, score_deals, format_shortlist

if TYPE_CHECKING:
    from simulation.agents.sentinel_agent import SentinelAgent


QUALITY_RANK = {"C": 0, "B": 1, "A": 2}


@dataclass
class BuyerRequirements:
    id: str
    name: str
    location_state: str
    required_category: str
    quantity_units: int
    target_price_per_unit: float
    max_price_per_unit: float
    quality_min: str
    delivery_deadline_days: int
    payment_preference: str
    required_certifications: list[str] = field(default_factory=list)
    blacklisted_sellers: list[str] = field(default_factory=list)
    max_sellers_to_query: int = 100
    negotiation_rounds_budget: int = 10
    negotiation_strategy: str = "conceder"
    # Extended fields
    urgency_level: str = "normal"          # low / normal / high / urgent
    allow_moq_waiver: bool = True
    allow_partial_fulfillment: bool = True
    max_moq_premium_pct: float = 7.0       # max % premium for MOQ waiver

    @classmethod
    def from_dict(cls, data: dict) -> "BuyerRequirements":
        return cls(
            id=data["id"],
            name=data["name"],
            location_state=data["location_state"],
            required_category=data["required_category"],
            quantity_units=data["quantity_units"],
            target_price_per_unit=data["target_price_per_unit"],
            max_price_per_unit=data["max_price_per_unit"],
            quality_min=data["quality_min"],
            delivery_deadline_days=data["delivery_deadline_days"],
            payment_preference=data["payment_preference"],
            required_certifications=data.get("required_certifications", []),
            blacklisted_sellers=data.get("blacklisted_sellers", []),
            max_sellers_to_query=data.get("max_sellers_to_query", 100),
            negotiation_rounds_budget=data.get("negotiation_rounds_budget", 10),
            negotiation_strategy=data.get("negotiation_strategy", "conceder"),
            urgency_level=data.get("urgency_level", "normal"),
            allow_moq_waiver=data.get("allow_moq_waiver", True),
            allow_partial_fulfillment=data.get("allow_partial_fulfillment", True),
            max_moq_premium_pct=data.get("max_moq_premium_pct", 7.0),
        )


class BuyerAgent:
    def __init__(self, requirements: BuyerRequirements, top_n: int = 10, use_llm: bool = True):
        self.req = requirements
        self.top_n = top_n
        self.use_llm = use_llm

    async def negotiate_with_all(
        self,
        sellers: list[SellerAgent],
        timeout_per_negotiation: float = 30.0,
        sentinel: Optional["SentinelAgent"] = None,
    ) -> tuple[list[NegotiatedDeal], list[NegotiatedDeal]]:
        """
        Filter eligible sellers, negotiate with all concurrently (two-pass BATNA),
        return (top_deals, all_deals).

        Two-pass approach:
          Pass 1: Quick 3-round pre-screen of first 5 sellers → compute BATNA price
          Pass 2: Full 10-round negotiation for ALL sellers, with BATNA context
        """
        eligible = self._filter_sellers(sellers)
        if not eligible:
            return [], []

        eligible = eligible[: self.req.max_sellers_to_query]

        # ── Pass 1: BATNA estimation (quick 3-round scan) ────────────────────
        batna_price: Optional[float] = None
        if len(eligible) >= 5:
            quick_sample = eligible[:5]
            quick_tasks = [
                run_negotiation(self._build_session(s, i, timeout_per_negotiation,
                                                    max_rounds=3, batna_price=None))
                for i, s in enumerate(quick_sample)
            ]
            quick_deals: list[NegotiatedDeal] = await asyncio.gather(*quick_tasks)
            closed_quick = [d for d in quick_deals if d.deal_reached and d.final_price > 0]
            if closed_quick:
                # BATNA = best (lowest) price from quick scan
                batna_price = min(d.final_price for d in closed_quick)

        # ── Pass 2: Full negotiation with BATNA ──────────────────────────────
        tasks = [
            run_negotiation(
                self._build_session(s, i, timeout_per_negotiation,
                                    max_rounds=self.req.negotiation_rounds_budget,
                                    batna_price=batna_price)
            )
            for i, s in enumerate(eligible)
        ]
        all_deals: list[NegotiatedDeal] = await asyncio.gather(*tasks)

        # ── Sentinel monitoring ───────────────────────────────────────────────
        if sentinel is not None:
            for i, deal in enumerate(all_deals):
                session_id = f"{self.req.id}-{deal.seller_id}-{i}"
                sentinel.monitor_deal(deal, session_id=session_id)

        top_deals = score_deals(
            all_deals,
            buyer_max_price=self.req.max_price_per_unit,
            buyer_deadline_days=self.req.delivery_deadline_days,
            top_n=self.top_n,
        )
        return top_deals, list(all_deals)

    def _filter_sellers(self, sellers: list[SellerAgent]) -> list[SellerAgent]:
        """
        Pre-filter sellers before negotiation.
        MOQ-close sellers (qty >= moq × 0.55) are NOT filtered out
        if allow_moq_waiver is True — they pass to the protocol for waiver negotiation.
        """
        eligible = []
        for s in sellers:
            if not s.is_online:
                continue
            if s.id in self.req.blacklisted_sellers or self.req.id in s.blacklisted_by:
                continue
            if s.category != self.req.required_category:
                continue
            if QUALITY_RANK.get(s.quality_grade, 0) < QUALITY_RANK.get(self.req.quality_min, 0):
                continue
            if self.req.required_certifications:
                if not all(c in s.quality_certifications for c in self.req.required_certifications):
                    continue
            # Rough price viability: floor price must be within buyer's max budget
            if s.floor_price_per_unit > self.req.max_price_per_unit:
                continue
            # MOQ check: hard-reject only if buyer qty < 55% of MOQ AND no waiver allowed
            if self.req.quantity_units < s.moq:
                if not self.req.allow_moq_waiver:
                    continue
                if self.req.quantity_units < s.moq * 0.55:
                    continue   # Too far below MOQ even for waiver
            eligible.append(s)
        return eligible

    def _build_session(
        self,
        seller: SellerAgent,
        session_index: int,
        timeout: float,
        max_rounds: int = 10,
        batna_price: Optional[float] = None,
    ) -> NegotiationSession:
        return NegotiationSession(
            session_id=f"{self.req.id}-{seller.id}-{session_index}",
            buyer_id=self.req.id,
            seller_id=seller.id,
            seller_name=seller.name,
            max_rounds=max_rounds,
            timeout_seconds=timeout,
            # Buyer side
            buyer_target_price=self.req.target_price_per_unit,
            buyer_max_price=self.req.max_price_per_unit,
            buyer_quantity=self.req.quantity_units,
            buyer_deadline_days=self.req.delivery_deadline_days,
            buyer_payment_pref=self.req.payment_preference,
            buyer_quality_min=self.req.quality_min,
            buyer_strategy=self.req.negotiation_strategy,
            buyer_urgency=self.req.urgency_level,
            allow_moq_waiver=self.req.allow_moq_waiver,
            allow_partial=self.req.allow_partial_fulfillment,
            max_moq_premium_pct=self.req.max_moq_premium_pct,
            buyer_batna_price=batna_price,
            # Seller side
            seller_floor_price=seller.floor_price_per_unit,
            seller_list_price=seller.list_price_per_unit,
            seller_moq=seller.moq,
            seller_max_qty=seller.max_order_qty,
            seller_quality=seller.quality_grade,
            seller_delivery_min=seller.delivery_days_min,
            seller_delivery_max=seller.delivery_days_max,
            seller_payment_terms=seller.payment_terms_accepted,
            seller_strategy=seller.negotiation_strategy,
            seller_stock=seller.available_stock,
            seller_blacklisted=(self.req.id in seller.blacklisted_by),
            seller_negotiation_willingness=getattr(seller, "negotiation_willingness", 0.7),
            seller_rating=getattr(seller, "rating", 4.0),
            seller_total_orders=getattr(seller, "total_orders_completed", 100),
            seller_payment_reliability=getattr(seller, "payment_reliability", 0.9),
            category=seller.category,
            use_llm=self.use_llm,
        )

    def get_shortlist_text(self, top_deals: list[NegotiatedDeal]) -> str:
        return format_shortlist(top_deals, self.req.name)
