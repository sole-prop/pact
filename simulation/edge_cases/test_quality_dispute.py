"""
Edge Case 11: QUALITY GRADE DISPUTE
Buyer requires grade A; sellers only have grade B or C.
Expected: All sellers filtered out due to quality_below_minimum.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    sellers = [
        SellerAgent(
            id=f"SQD{i}", name=f"Low Grade Seller {i}", category="agricultural_equipment",
            location_state="Bihar", gstin=f"10QDA{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=15000.0, list_price_per_unit=20000.0,
            moq=5, max_order_qty=100,
            quality_grade="B" if i % 2 == 0 else "C",  # No grade A
            quality_certifications=[],
            delivery_days_min=15, delivery_days_max=45,
            payment_terms_accepted=["net_30", "advance_50"],
            negotiation_strategy="conceder",
            max_discount_pct=10.0,
            current_stock_units=50, rating=3.5,
            total_orders_completed=5, whatsapp_number="",
        )
        for i in range(6)
    ]

    buyer_req = BuyerRequirements(
        id="B011", name="Quality Buyer", location_state="Punjab",
        required_category="agricultural_equipment",
        quantity_units=10,
        target_price_per_unit=16000.0, max_price_per_unit=22000.0,
        quality_min="A",           # Requires grade A only
        delivery_deadline_days=60,
        payment_preference="net_30",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    all_quality_rejected = all(
        not d.deal_reached and d.failure_reason == "quality_below_minimum"
        for d in all_deals
    )
    passed = all_quality_rejected and len(top_deals) == 0
    summary = (
        f"All {len(all_deals)} sellers rejected: quality grade B/C below buyer's minimum A. "
        f"Top deals: {len(top_deals)}."
    )
    if verbose:
        for d in all_deals:
            print(f"  {d.seller_id}: quality_grade=?, reason={d.failure_reason}")

    return {"passed": passed, "summary": summary}
