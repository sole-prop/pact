"""
MarketplaceOrchestrator: Loads sellers, routes buyers, runs negotiations,
and produces ranked shortlists. Central hub of the simulation.
"""
import asyncio
import json
from pathlib import Path
from typing import Optional

from simulation.agents.seller_agent import SellerAgent
from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.negotiation.ranking import NegotiatedDeal


DATA_DIR = Path(__file__).parent.parent / "data"


class MarketplaceOrchestrator:
    def __init__(
        self,
        sellers_path: Optional[Path] = None,
        buyers_path: Optional[Path] = None,
    ):
        self.sellers_path = sellers_path or DATA_DIR / "mock_sellers.json"
        self.buyers_path = buyers_path or DATA_DIR / "mock_buyers.json"
        self.sellers: list[SellerAgent] = []
        self.buyers_req: list[BuyerRequirements] = []
        self._load_data()

    def _load_data(self):
        with open(self.sellers_path) as f:
            self.sellers = [SellerAgent.from_dict(d) for d in json.load(f)]
        with open(self.buyers_path) as f:
            self.buyers_req = [BuyerRequirements.from_dict(d) for d in json.load(f)]

    def get_sellers(self) -> list[SellerAgent]:
        return self.sellers

    def get_buyer_by_id(self, buyer_id: str) -> Optional[BuyerRequirements]:
        return next((b for b in self.buyers_req if b.id == buyer_id), None)

    def get_seller_by_id(self, seller_id: str) -> Optional[SellerAgent]:
        return next((s for s in self.sellers if s.id == seller_id), None)

    async def run_single_buyer(
        self,
        buyer_req: BuyerRequirements,
        sellers_override: Optional[list[SellerAgent]] = None,
        top_n: int = 10,
        timeout_per_negotiation: float = 30.0,
    ) -> dict:
        """
        Run full negotiation cycle for one buyer.
        Returns dict with shortlist and stats.
        """
        sellers = sellers_override if sellers_override is not None else self.sellers
        agent = BuyerAgent(buyer_req, top_n=top_n)
        top_deals, all_deals = await agent.negotiate_with_all(
            sellers, timeout_per_negotiation=timeout_per_negotiation
        )
        stats = _compute_stats(all_deals, buyer_req)
        return {
            "buyer_id": buyer_req.id,
            "buyer_name": buyer_req.name,
            "total_sellers_queried": stats["total"],
            "deals_reached": stats["successful"],
            "deals_failed": stats["failed"],
            "failure_reasons": stats["failure_reasons"],
            "top_deals": [_deal_to_dict(d) for d in top_deals],
            "shortlist_text": agent.get_shortlist_text(top_deals),
        }

    async def run_all_buyers(
        self,
        top_n: int = 10,
        max_concurrent_buyers: int = 10,
        timeout_per_negotiation: float = 30.0,
    ) -> list[dict]:
        """
        Run all buyers concurrently (up to max_concurrent_buyers at a time).
        Simulates the buyer storm scenario at scale.
        """
        semaphore = asyncio.Semaphore(max_concurrent_buyers)

        async def bounded_run(buyer_req):
            async with semaphore:
                return await self.run_single_buyer(
                    buyer_req, top_n=top_n, timeout_per_negotiation=timeout_per_negotiation
                )

        results = await asyncio.gather(*[bounded_run(b) for b in self.buyers_req])
        return list(results)


def _compute_stats(deals: list[NegotiatedDeal], buyer_req: BuyerRequirements) -> dict:
    total = len(deals)
    successful = [d for d in deals if d.deal_reached]
    failed = [d for d in deals if not d.deal_reached]
    reasons: dict[str, int] = {}
    for d in failed:
        reasons[d.failure_reason or "unknown"] = reasons.get(d.failure_reason or "unknown", 0) + 1
    return {
        "total": total,
        "successful": len(successful),
        "failed": len(failed),
        "failure_reasons": reasons,
    }


def _deal_to_dict(d: NegotiatedDeal) -> dict:
    return {
        "seller_id": d.seller_id,
        "seller_name": d.seller_name,
        "final_price": d.final_price,
        "quantity": d.quantity,
        "quality_grade": d.quality_grade,
        "delivery_days": d.delivery_days,
        "payment_term": d.payment_term,
        "negotiation_rounds": d.negotiation_rounds,
        "composite_score": d.composite_score,
        "narrative": d.narrative,
    }
