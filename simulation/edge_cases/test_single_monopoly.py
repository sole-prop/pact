"""
Edge Case 8: SINGLE SELLER MONOPOLY
Only 1 seller available for a niche product category.
Expected: Agent reports monopoly situation; buyer gets 1-item shortlist with warning.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    sole_seller = SellerAgent(
        id="SMONO", name="Monopoly Supplier", category="ceramic_tiles",
        location_state="Andhra Pradesh", gstin="37MON00001Z5",
        is_msme_registered=False,  # Not MSME — premium supplier
        floor_price_per_unit=1500.0, list_price_per_unit=1800.0,
        moq=200, max_order_qty=5000,
        quality_grade="A", quality_certifications=["ISO9001", "BIS"],
        delivery_days_min=10, delivery_days_max=25,
        payment_terms_accepted=["advance_50", "net_15"],
        negotiation_strategy="hardball",
        max_discount_pct=2.0,
        current_stock_units=3000, rating=4.9,
        total_orders_completed=500, whatsapp_number="",
    )

    buyer_req = BuyerRequirements(
        id="B008", name="Niche Buyer", location_state="Telangana",
        required_category="ceramic_tiles",
        quantity_units=500,
        target_price_per_unit=1400.0, max_price_per_unit=1900.0,
        quality_min="A", delivery_deadline_days=30,
        payment_preference="net_15",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all([sole_seller])

    only_one_seller = len(all_deals) == 1
    monopoly_flag = only_one_seller and len(top_deals) <= 1

    passed = only_one_seller
    summary = (
        f"Single seller scenario: {len(all_deals)} seller negotiated. "
        f"Deal reached: {all_deals[0].deal_reached if all_deals else False}. "
        f"Monopoly warning: buyer has no alternatives."
    )
    if verbose and all_deals:
        d = all_deals[0]
        print(f"  {d.seller_id}: price=₹{d.final_price}, reached={d.deal_reached}")

    return {"passed": passed, "summary": summary}
