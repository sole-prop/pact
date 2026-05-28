"""
Edge Case 1: DEADLOCK
All sellers reject buyer's max price (floor_price > buyer max_price for all sellers).
Expected: Agent returns graceful "no deals found" message, no crash.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


def _make_sellers(n=10, floor=99999.0):
    return [
        SellerAgent(
            id=f"S{i}", name=f"Seller {i}", category="steel_raw",
            location_state="Maharashtra", gstin=f"27ABC{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=floor,
            list_price_per_unit=floor * 1.2,
            moq=10, max_order_qty=1000,
            quality_grade="B", quality_certifications=[],
            delivery_days_min=5, delivery_days_max=15,
            payment_terms_accepted=["net_30"],
            negotiation_strategy="hardball",
            max_discount_pct=1.0,
            current_stock_units=500, rating=4.0,
            total_orders_completed=10, whatsapp_number="",
        )
        for i in range(n)
    ]


async def run(verbose=False) -> dict:
    buyer_req = BuyerRequirements(
        id="B001", name="Test Buyer", location_state="Delhi",
        required_category="steel_raw",
        quantity_units=100,
        target_price_per_unit=5000.0,
        max_price_per_unit=6000.0,        # All sellers have floor=99999, way above this
        quality_min="B",
        delivery_deadline_days=30,
        payment_preference="net_30",
    )

    sellers = _make_sellers(n=10, floor=99999.0)
    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    all_failed = all(not d.deal_reached for d in all_deals)
    no_top_deals = len(top_deals) == 0
    passed = all_failed and no_top_deals

    summary = (
        f"All {len(all_deals)} negotiations failed due to 'price_floor_above_buyer_max'. "
        f"Top deals returned: {len(top_deals)}."
        if passed
        else f"UNEXPECTED: {len(top_deals)} deals reached."
    )
    if verbose:
        reasons = {d.failure_reason for d in all_deals}
        print(f"[deadlock] Failure reasons: {reasons}")
        print(agent.get_shortlist_text(top_deals))

    return {"passed": passed, "summary": summary}
