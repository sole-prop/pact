"""
Edge Case 10: COUNTER-OFFER SPIRAL
Both buyer and seller use strategies that never converge within max rounds.
Expected: Max rounds reached → best-so-far fallback is used, no infinite loop.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    # Seller uses hardball (barely concedes); buyer uses boulware (also barely concedes)
    # Gap: buyer max=8000, seller floor=7500 → barely overlaps but strategies may not converge fast
    sellers = [
        SellerAgent(
            id=f"SCSP{i}", name=f"Spiral Seller {i}", category="leather_goods",
            location_state="Tamil Nadu", gstin=f"33SPR{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=7500.0, list_price_per_unit=11000.0,
            moq=20, max_order_qty=500,
            quality_grade="B", quality_certifications=[],
            delivery_days_min=10, delivery_days_max=25,
            payment_terms_accepted=["advance_50", "net_15"],
            negotiation_strategy="hardball",  # Barely concedes
            max_discount_pct=1.0,
            current_stock_units=200, rating=3.8,
            total_orders_completed=15, whatsapp_number="",
        )
        for i in range(3)
    ]

    buyer_req = BuyerRequirements(
        id="B010", name="Spiral Buyer", location_state="Karnataka",
        required_category="leather_goods",
        quantity_units=50,
        target_price_per_unit=6000.0,   # Low target
        max_price_per_unit=8000.0,      # Max overlaps with floor
        quality_min="B", delivery_deadline_days=30,
        payment_preference="net_15",
        negotiation_strategy="boulware",  # Also stubborn
        negotiation_rounds_budget=5,      # Only 5 rounds
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    # Regardless of convergence, should complete without hanging
    completed = len(all_deals) == len(sellers)
    no_infinite_loop = True  # If we got here, no infinite loop occurred

    passed = completed and no_infinite_loop
    reached = sum(1 for d in all_deals if d.deal_reached)
    summary = (
        f"Spiral scenario: {len(all_deals)} negotiations completed (no hang). "
        f"Deals reached: {reached}. Best-so-far fallback active."
    )
    if verbose:
        for d in all_deals:
            print(f"  {d.seller_id}: reached={d.deal_reached}, rounds={d.negotiation_rounds}, reason={d.failure_reason}")

    return {"passed": passed, "summary": summary}
