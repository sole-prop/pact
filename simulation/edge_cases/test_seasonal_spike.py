"""
Edge Case 12: SEASONAL PRICE SPIKE
External market event (festival/harvest season) inflates ALL seller prices above buyer's max.
Expected: All negotiations fail; agent reports market spike condition.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    # Simulate seasonal spike: all floor prices 40% above normal
    SPIKE_MULTIPLIER = 1.40
    BASE_FLOOR = 5000.0
    spiked_floor = BASE_FLOOR * SPIKE_MULTIPLIER  # = 7000

    sellers = [
        SellerAgent(
            id=f"SSS{i}", name=f"Spike Seller {i}", category="fabric_textile",
            location_state="Gujarat", gstin=f"24SPK{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=spiked_floor,
            list_price_per_unit=spiked_floor * 1.25,
            moq=100, max_order_qty=5000,
            quality_grade="B", quality_certifications=[],
            delivery_days_min=7, delivery_days_max=20,
            payment_terms_accepted=["net_30"],
            negotiation_strategy="boulware",
            max_discount_pct=5.0,
            current_stock_units=1000, rating=4.0,
            total_orders_completed=200, whatsapp_number="",
        )
        for i in range(8)
    ]

    buyer_req = BuyerRequirements(
        id="B012", name="Festival Season Buyer", location_state="Rajasthan",
        required_category="fabric_textile",
        quantity_units=200,
        target_price_per_unit=4500.0,   # Based on normal (pre-spike) prices
        max_price_per_unit=5500.0,      # Still below spiked floor of 7000
        quality_min="B", delivery_deadline_days=15,
        payment_preference="net_30",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    all_failed = all(not d.deal_reached for d in all_deals)
    passed = all_failed and len(top_deals) == 0
    reasons = set(d.failure_reason for d in all_deals)
    summary = (
        f"Seasonal spike: all {len(all_deals)} sellers priced above buyer max. "
        f"Failure reasons: {reasons}. "
        f"Buyer should be advised to revisit budget or wait for prices to normalize."
    )
    if verbose:
        print(f"  Spiked floor: ₹{spiked_floor:,.2f}, Buyer max: ₹{buyer_req.max_price_per_unit:,.2f}")

    return {"passed": passed, "summary": summary}
