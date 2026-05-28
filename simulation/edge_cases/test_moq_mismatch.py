"""
Edge Case 6: MOQ MISMATCH
All sellers have MOQ greater than buyer's requested quantity.
Expected: All negotiations fail with 'moq_not_met'.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    sellers = [
        SellerAgent(
            id=f"SMOQ{i}", name=f"High MOQ Seller {i}", category="chemical_industrial",
            location_state="Rajasthan", gstin=f"08MOQ{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=500.0, list_price_per_unit=650.0,
            moq=500,           # MOQ = 500, buyer only needs 50
            max_order_qty=50000,
            quality_grade="B", quality_certifications=[],
            delivery_days_min=10, delivery_days_max=30,
            payment_terms_accepted=["net_30"],
            negotiation_strategy="boulware",
            max_discount_pct=8.0,
            current_stock_units=5000, rating=4.0,
            total_orders_completed=20, whatsapp_number="",
        )
        for i in range(5)
    ]

    buyer_req = BuyerRequirements(
        id="B006", name="Small Buyer MOQ Test", location_state="Punjab",
        required_category="chemical_industrial",
        quantity_units=50,     # Only needs 50 units
        target_price_per_unit=550.0, max_price_per_unit=700.0,
        quality_min="B", delivery_deadline_days=30,
        payment_preference="net_30",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    all_moq_failed = all(
        not d.deal_reached and d.failure_reason == "moq_not_met"
        for d in all_deals
    )
    passed = all_moq_failed and len(top_deals) == 0
    summary = (
        f"All {len(all_deals)} sellers rejected due to MOQ mismatch. "
        f"Buyer needs 50, all sellers require 500+."
    )
    if verbose:
        for d in all_deals:
            print(f"  {d.seller_id}: {d.failure_reason}")

    return {"passed": passed, "summary": summary}
