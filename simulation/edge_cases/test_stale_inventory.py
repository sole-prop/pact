"""
Edge Case 5: STALE INVENTORY
Seller has stock=0 but is still listed. Buyer should not receive this seller in deals.
Expected: Seller with zero stock fails pre-check with 'insufficient_stock'.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    stale_seller = SellerAgent(
        id="SSTALE", name="Stale Stock Seller", category="electronic_components",
        location_state="Karnataka", gstin="29STAL0001Z5",
        is_msme_registered=True,
        floor_price_per_unit=2000.0, list_price_per_unit=2500.0,
        moq=10, max_order_qty=1000,
        quality_grade="A", quality_certifications=["CE"],
        delivery_days_min=3, delivery_days_max=10,
        payment_terms_accepted=["net_30"],
        negotiation_strategy="conceder",
        max_discount_pct=10.0,
        current_stock_units=0,   # STALE — no stock
        rating=4.8, total_orders_completed=300, whatsapp_number="",
    )

    good_seller = SellerAgent(
        id="SGOOD", name="Good Stock Seller", category="electronic_components",
        location_state="Karnataka", gstin="29GOOD0001Z5",
        is_msme_registered=True,
        floor_price_per_unit=2100.0, list_price_per_unit=2600.0,
        moq=10, max_order_qty=1000,
        quality_grade="A", quality_certifications=["CE"],
        delivery_days_min=3, delivery_days_max=10,
        payment_terms_accepted=["net_30"],
        negotiation_strategy="conceder",
        max_discount_pct=12.0,
        current_stock_units=500,  # Good stock
        rating=4.5, total_orders_completed=150, whatsapp_number="",
    )

    buyer_req = BuyerRequirements(
        id="B005", name="Stale Test Buyer", location_state="Telangana",
        required_category="electronic_components",
        quantity_units=50,
        target_price_per_unit=2200.0, max_price_per_unit=2700.0,
        quality_min="A", delivery_deadline_days=15,
        payment_preference="net_30",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all([stale_seller, good_seller])

    stale_deal = next((d for d in all_deals if d.seller_id == "SSTALE"), None)
    good_deal = next((d for d in all_deals if d.seller_id == "SGOOD"), None)

    stale_rejected = stale_deal is not None and not stale_deal.deal_reached and \
                     stale_deal.failure_reason == "insufficient_stock"
    good_succeeded = good_deal is not None and good_deal.deal_reached

    passed = stale_rejected and good_succeeded
    summary = (
        f"Stale seller rejected (insufficient_stock): {stale_rejected}. "
        f"Good seller deal reached: {good_succeeded}."
    )
    if verbose and stale_deal:
        print(f"  Stale seller failure: {stale_deal.failure_reason}")

    return {"passed": passed, "summary": summary}
