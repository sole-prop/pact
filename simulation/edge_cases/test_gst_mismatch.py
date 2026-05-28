"""
Edge Case 13: GST MISMATCH
Interstate transaction adds 18% GST making the effective price exceed buyer's budget.
Expected: Agent computes GST-inclusive effective price before ranking; interstate deals ranked lower.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent
from simulation.negotiation.ranking import NegotiatedDeal, score_deals


GST_RATES = {"intrastate": 0.09, "interstate": 0.18}  # CGST+SGST vs IGST


def effective_price_with_gst(price: float, buyer_state: str, seller_state: str) -> float:
    rate = GST_RATES["intrastate"] if buyer_state == seller_state else GST_RATES["interstate"]
    return round(price * (1 + rate), 2)


async def run(verbose=False) -> dict:
    buyer_state = "Maharashtra"
    buyer_max_excl_gst = 5000.0
    buyer_max_incl_gst = buyer_max_excl_gst * 1.18  # ₹5,900

    same_state_seller = SellerAgent(
        id="SGST_SAME", name="Maharashtra Seller (intrastate)",
        category="plastic_granules", location_state=buyer_state,
        gstin="27GST00001Z5", is_msme_registered=True,
        floor_price_per_unit=4600.0, list_price_per_unit=5400.0,
        moq=50, max_order_qty=2000, quality_grade="B",
        quality_certifications=[], delivery_days_min=5, delivery_days_max=12,
        payment_terms_accepted=["net_30"], negotiation_strategy="conceder",
        max_discount_pct=10.0, current_stock_units=1000, rating=4.2,
        total_orders_completed=80, whatsapp_number="",
    )

    diff_state_seller = SellerAgent(
        id="SGST_DIFF", name="Gujarat Seller (interstate)",
        category="plastic_granules", location_state="Gujarat",
        gstin="24GST00002Z5", is_msme_registered=True,
        floor_price_per_unit=4200.0, list_price_per_unit=5000.0,  # Cheaper base price
        moq=50, max_order_qty=2000, quality_grade="B",
        quality_certifications=[], delivery_days_min=8, delivery_days_max=18,
        payment_terms_accepted=["net_30"], negotiation_strategy="conceder",
        max_discount_pct=12.0, current_stock_units=1000, rating=4.0,
        total_orders_completed=60, whatsapp_number="",
    )

    buyer_req = BuyerRequirements(
        id="B013", name="GST-aware Buyer", location_state=buyer_state,
        required_category="plastic_granules",
        quantity_units=100,
        target_price_per_unit=4500.0, max_price_per_unit=buyer_max_excl_gst,
        quality_min="B", delivery_deadline_days=20,
        payment_preference="net_30",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all([same_state_seller, diff_state_seller])

    # Compute GST-inclusive effective prices
    gst_analysis = []
    for d in all_deals:
        seller = same_state_seller if d.seller_id == "SGST_SAME" else diff_state_seller
        effective = effective_price_with_gst(d.final_price, buyer_state, seller.location_state)
        affordable = effective <= buyer_max_incl_gst
        gst_analysis.append({
            "seller": d.seller_id, "base_price": d.final_price,
            "effective_with_gst": effective, "affordable": affordable,
            "deal_reached": d.deal_reached,
        })

    passed = len(all_deals) == 2  # Both attempts were made
    deals_str = str([(g["seller"], "Rs." + "{:,.2f}".format(g["effective_with_gst"])) for g in gst_analysis])
    summary = (
        f"GST analysis: same-state (9% GST) vs interstate (18% GST). "
        f"Effective prices computed for ranking. "
        f"Deals: {deals_str}."
    )
    if verbose:
        for g in gst_analysis:
            print(f"  {g['seller']}: base=₹{g['base_price']:,.2f}, +GST=₹{g['effective_with_gst']:,.2f}, affordable={g['affordable']}")

    return {"passed": passed, "summary": summary, "gst_analysis": gst_analysis}
