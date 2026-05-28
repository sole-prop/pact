"""
Edge Case 3: FLOOR PRICE BREACH ATTEMPTS
Buyer's target price is below sellers' floor price.
Seller must terminate negotiation (not accept below-floor offers).
Expected: All deals fail with floor-related reasons; no deal below floor.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    seller_floor = 5000.0

    sellers = [
        SellerAgent(
            id=f"SF{i}", name=f"Floor Seller {i}", category="plastic_granules",
            location_state="Tamil Nadu", gstin=f"33FLR{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=seller_floor,
            list_price_per_unit=6000.0,
            moq=50, max_order_qty=2000,
            quality_grade="A", quality_certifications=["ISO9001"],
            delivery_days_min=5, delivery_days_max=12,
            payment_terms_accepted=["net_30", "net_15"],
            negotiation_strategy="boulware",
            max_discount_pct=5.0,
            current_stock_units=1000, rating=4.7,
            total_orders_completed=200, whatsapp_number="",
        )
        for i in range(5)
    ]

    # Buyer wants to pay 3000, well below floor of 5000
    buyer_req = BuyerRequirements(
        id="B003", name="Floor Breach Buyer", location_state="Kerala",
        required_category="plastic_granules",
        quantity_units=100,
        target_price_per_unit=2500.0,
        max_price_per_unit=3500.0,     # max = 3500, still below floor = 5000
        quality_min="A",
        delivery_deadline_days=15,
        payment_preference="net_30",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    # All should fail because filter catches floor > buyer_max before negotiation
    all_rejected = all(not d.deal_reached for d in all_deals)
    # Ensure no deal was made below the floor price
    no_below_floor = all(d.final_price >= seller_floor or not d.deal_reached for d in all_deals)

    passed = all_rejected and no_below_floor
    summary = (
        f"All {len(all_deals)} offers rejected. "
        f"Floor price integrity maintained: {no_below_floor}. "
        f"No deal below ₹{seller_floor:,.2f}."
    )
    if verbose:
        for d in all_deals:
            print(f"  {d.seller_id}: {d.failure_reason}")

    return {"passed": passed, "summary": summary}
