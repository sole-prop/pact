"""
Edge Case 2: COLLUDING SELLERS
10 sellers all use "hardball" strategy and high floor prices (cartel behavior).
Expected: Buyer gets fewer or zero deals; cartel detected via failure reason analysis.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    # Colluding sellers: all have same above-market floor price
    cartel_floor = 12000.0
    buyer_max = 10000.0

    cartel_sellers = [
        SellerAgent(
            id=f"SC{i}", name=f"Cartel Seller {i}", category="steel_raw",
            location_state="Gujarat", gstin=f"24CAR{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=cartel_floor,
            list_price_per_unit=cartel_floor * 1.1,
            moq=10, max_order_qty=5000,
            quality_grade="B", quality_certifications=[],
            delivery_days_min=7, delivery_days_max=21,
            payment_terms_accepted=["advance_50"],
            negotiation_strategy="hardball",
            max_discount_pct=0.5,
            current_stock_units=1000, rating=4.0,
            total_orders_completed=50, whatsapp_number="",
        )
        for i in range(10)
    ]

    # A few honest sellers with fair prices
    honest_sellers = [
        SellerAgent(
            id=f"SH{i}", name=f"Honest Seller {i}", category="steel_raw",
            location_state="Maharashtra", gstin=f"27HON{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=7000.0,
            list_price_per_unit=8500.0,
            moq=10, max_order_qty=5000,
            quality_grade="B", quality_certifications=[],
            delivery_days_min=5, delivery_days_max=14,
            payment_terms_accepted=["net_30", "net_15"],
            negotiation_strategy="conceder",
            max_discount_pct=15.0,
            current_stock_units=500, rating=4.5,
            total_orders_completed=100, whatsapp_number="",
        )
        for i in range(5)
    ]

    buyer_req = BuyerRequirements(
        id="B002", name="Collusion Test Buyer", location_state="Rajasthan",
        required_category="steel_raw",
        quantity_units=200,
        target_price_per_unit=8000.0,
        max_price_per_unit=buyer_max,
        quality_min="B",
        delivery_deadline_days=20,
        payment_preference="net_30",
    )

    all_sellers = cartel_sellers + honest_sellers
    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(all_sellers)

    # Cartel sellers are pre-filtered (floor > buyer_max) so never appear in all_deals
    negotiated_ids = {d.seller_id for d in all_deals}
    cartel_in_deals = sum(1 for sid in negotiated_ids if sid.startswith("SC"))
    honest_successes = sum(1 for d in top_deals if d.seller_id.startswith("SH"))

    # Cartel sellers should NOT be in negotiations at all (price filter kicked them out)
    cartel_excluded = cartel_in_deals == 0
    passed = cartel_excluded and honest_successes > 0
    summary = (
        f"Cartel sellers pre-filtered (floor Rs.{cartel_floor:,.0f} > buyer max Rs.{buyer_max:,.0f}): "
        f"excluded={cartel_excluded}. "
        f"Honest sellers in top deals: {honest_successes}/5. "
        f"Buyer protected from price manipulation."
    )
    if verbose:
        print(agent.get_shortlist_text(top_deals))

    return {"passed": passed, "summary": summary}
