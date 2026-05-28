"""
Edge Case 16: PARTIAL FULFILLMENT
No single seller can fulfill buyer's full quantity. Agent recommends split order.
Expected: System identifies multiple sellers whose combined qty covers buyer's need.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


def find_split_order(
    deals: list, buyer_qty: int
) -> list[dict]:
    """Greedy split: combine sellers until buyer qty is met."""
    successful = sorted(
        [d for d in deals if d.deal_reached],
        key=lambda d: d.composite_score,
        reverse=True,
    )
    split = []
    remaining = buyer_qty
    for deal in successful:
        if remaining <= 0:
            break
        alloc = min(deal.quantity, remaining)
        split.append({
            "seller_id": deal.seller_id,
            "seller_name": deal.seller_name,
            "allocated_qty": alloc,
            "price": deal.final_price,
        })
        remaining -= alloc
    return split if remaining <= 0 else []


async def run(verbose=False) -> dict:
    # Each seller can supply max 100 units; buyer needs 400
    sellers = [
        SellerAgent(
            id=f"SPF{i}", name=f"Partial Seller {i}", category="packaging_material",
            location_state="Karnataka", gstin=f"29PRT{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=300.0, list_price_per_unit=400.0,
            moq=50,
            max_order_qty=100,   # Max 100 per seller
            quality_grade="B", quality_certifications=[],
            delivery_days_min=5, delivery_days_max=14,
            payment_terms_accepted=["net_30", "advance_50"],
            negotiation_strategy="conceder",
            max_discount_pct=12.0,
            current_stock_units=100, rating=4.0 + i * 0.1,
            total_orders_completed=30 + i * 10, whatsapp_number="",
        )
        for i in range(8)  # 8 sellers × 100 units = 800 max → enough for 400
    ]

    total_needed = 400

    # For partial fulfillment: negotiate each seller for their max_order_qty (100)
    # then assemble a split order from successful deals
    buyer_req = BuyerRequirements(
        id="B016", name="Large Order Buyer", location_state="Telangana",
        required_category="packaging_material",
        quantity_units=100,   # Per-seller negotiation quantity = seller's max
        target_price_per_unit=320.0, max_price_per_unit=400.0,
        quality_min="B", delivery_deadline_days=21,
        payment_preference="net_30",
    )

    agent = BuyerAgent(buyer_req, top_n=10)
    top_deals, all_deals = await agent.negotiate_with_all(sellers)

    split = find_split_order(all_deals, total_needed)
    split_feasible = len(split) > 0
    total_covered = sum(s["allocated_qty"] for s in split)

    passed = split_feasible and total_covered >= total_needed
    summary = (
        f"Partial fulfillment: buyer needs {total_needed} units. "
        f"No single seller can supply all. "
        f"Split order: {len(split)} sellers covering {total_covered} units. "
        f"Feasible: {passed}."
    )
    if verbose:
        for s in split:
            print(f"  {s['seller_name']}: {s['allocated_qty']} units @ ₹{s['price']:,.2f}")

    return {"passed": passed, "summary": summary, "split_order": split}
