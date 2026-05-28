"""
Edge Case 9: SELLER AGENT TIMEOUT / OFFLINE
Seller agent goes offline mid-simulation (marked offline before negotiation).
Expected: Offline sellers skipped gracefully; online sellers proceed normally.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    sellers = []
    for i in range(6):
        s = SellerAgent(
            id=f"STO{i}", name=f"Seller {i}", category="auto_parts",
            location_state="Haryana", gstin=f"06AUTO{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=3000.0, list_price_per_unit=4000.0,
            moq=20, max_order_qty=2000,
            quality_grade="B", quality_certifications=[],
            delivery_days_min=7, delivery_days_max=20,
            payment_terms_accepted=["net_30"],
            negotiation_strategy="conceder",
            max_discount_pct=12.0,
            current_stock_units=500, rating=4.1,
            total_orders_completed=80, whatsapp_number="",
        )
        if i < 3:
            s.go_offline()  # First 3 sellers go offline
        sellers.append(s)

    buyer_req = BuyerRequirements(
        id="B009", name="Timeout Test Buyer", location_state="Delhi",
        required_category="auto_parts",
        quantity_units=50,
        target_price_per_unit=3200.0, max_price_per_unit=4200.0,
        quality_min="B", delivery_deadline_days=25,
        payment_preference="net_30",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    # Offline sellers are filtered before negotiation (is_online check in _filter_sellers)
    offline_count = sum(1 for s in sellers if not s.is_online)
    online_count = sum(1 for s in sellers if s.is_online)
    deals_attempted = len(all_deals)

    # Only online sellers should have been negotiated
    passed = deals_attempted == online_count
    summary = (
        f"Offline sellers skipped: {offline_count}. "
        f"Online sellers negotiated: {deals_attempted}/{online_count}. "
        f"Top deals: {len(top_deals)}."
    )
    if verbose:
        print(f"  Online sellers: {[s.id for s in sellers if s.is_online]}")
        print(f"  Deals reached: {[d.seller_id for d in top_deals]}")

    return {"passed": passed, "summary": summary}
