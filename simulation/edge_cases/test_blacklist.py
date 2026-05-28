"""
Edge Case 20: BUYER BLACKLIST
Buyer has blacklisted specific sellers. Agent must filter them out before negotiation.
Expected: Blacklisted sellers never appear in top deals or all_deals.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


async def run(verbose=False) -> dict:
    blacklisted_ids = {"SBL001", "SBL003"}

    sellers = [
        SellerAgent(
            id=f"SBL{i:03d}", name=f"Seller BL{i}", category="auto_parts",
            location_state="Haryana", gstin=f"06BLA{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=2500.0, list_price_per_unit=3200.0,
            moq=20, max_order_qty=2000, quality_grade="B",
            quality_certifications=[], delivery_days_min=7, delivery_days_max=21,
            payment_terms_accepted=["net_30"],
            negotiation_strategy="conceder", max_discount_pct=10.0,
            current_stock_units=500, rating=4.0, total_orders_completed=50,
            whatsapp_number="",
        )
        for i in range(6)
    ]

    # Also test seller-side blacklist: seller SBL004 has blacklisted buyer
    sellers[4].blacklisted_by = ["BBLIST"]

    buyer_req = BuyerRequirements(
        id="BBLIST", name="Blacklist Buyer", location_state="Delhi",
        required_category="auto_parts",
        quantity_units=100,
        target_price_per_unit=2700.0, max_price_per_unit=3500.0,
        quality_min="B", delivery_deadline_days=25,
        payment_preference="net_30",
        blacklisted_sellers=list(blacklisted_ids),  # Buyer blocks SBL001, SBL003
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    negotiated_ids = {d.seller_id for d in all_deals}

    # Blacklisted sellers should NOT appear in negotiations
    buyer_blacklist_enforced = len(blacklisted_ids & negotiated_ids) == 0
    # Seller-blacklisted buyer (SBL004 blacklisted BBLIST) should also be absent
    seller_blacklist_enforced = "SBL004" not in negotiated_ids

    passed = buyer_blacklist_enforced and seller_blacklist_enforced
    summary = (
        f"Blacklist enforcement: buyer blocked {blacklisted_ids}. "
        f"Seller SBL004 blocked buyer. "
        f"Negotiated sellers: {sorted(negotiated_ids)}. "
        f"Buyer blacklist enforced: {buyer_blacklist_enforced}. "
        f"Seller blacklist enforced: {seller_blacklist_enforced}."
    )
    if verbose:
        print(f"  Expected blocked: {blacklisted_ids | {'SBL004'}}")
        print(f"  Actual negotiated: {sorted(negotiated_ids)}")

    return {"passed": passed, "summary": summary}
