"""
Edge Case 19: MULTI-CATEGORY ORDER
Buyer needs 3 different product categories in one order. Agent spawns parallel sub-agents.
Expected: 3 independent buyer sub-agents run concurrently; each returns its own top-10.
"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


def _make_sellers_for_category(cat: str, n: int = 8, floor: float = 1000.0) -> list[SellerAgent]:
    return [
        SellerAgent(
            id=f"SMC_{cat}_{i}", name=f"{cat} Seller {i}", category=cat,
            location_state="Maharashtra", gstin=f"27MC{i:05d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=floor, list_price_per_unit=floor * 1.3,
            moq=20, max_order_qty=2000, quality_grade="B",
            quality_certifications=[], delivery_days_min=5, delivery_days_max=20,
            payment_terms_accepted=["net_30", "advance_50"],
            negotiation_strategy="conceder", max_discount_pct=12.0,
            current_stock_units=500, rating=4.1, total_orders_completed=50,
            whatsapp_number="",
        )
        for i in range(n)
    ]


async def run(verbose=False) -> dict:
    multi_order = [
        {"category": "steel_raw", "qty": 100, "target": 5000, "max": 6500},
        {"category": "fabric_textile", "qty": 200, "target": 800, "max": 1100},
        {"category": "plastic_granules", "qty": 150, "target": 2000, "max": 2600},
    ]

    all_sellers = {}
    for item in multi_order:
        cat = item["category"]
        all_sellers[cat] = _make_sellers_for_category(cat, n=8, floor=item["target"] * 0.90)

    async def run_sub_agent(item, parent_buyer_id: str):
        cat = item["category"]
        sub_req = BuyerRequirements(
            id=f"{parent_buyer_id}_{cat}", name=f"MSME Buyer - {cat}",
            location_state="Delhi", required_category=cat,
            quantity_units=item["qty"],
            target_price_per_unit=item["target"],
            max_price_per_unit=item["max"],
            quality_min="B", delivery_deadline_days=21,
            payment_preference="net_30",
        )
        agent = BuyerAgent(sub_req, top_n=5)
        top, all_d = await agent.negotiate_with_all(all_sellers[cat])
        return {
            "category": cat,
            "sellers_queried": len(all_d),
            "deals": len(top),
            "best_price": top[0].final_price if top else None,
        }

    results = await asyncio.gather(*[run_sub_agent(item, "BMULTI001") for item in multi_order])

    all_categories_have_results = all(r["deals"] > 0 for r in results)
    passed = len(results) == 3 and all_categories_have_results

    summary = (
        f"Multi-category: {len(results)} parallel sub-agents ran. "
        + " | ".join(
            f"{r['category']}: {r['deals']} deals (best ₹{r['best_price']:,.2f})"
            for r in results if r["best_price"]
        )
    )
    if verbose:
        for r in results:
            print(f"  {r['category']}: queried={r['sellers_queried']}, deals={r['deals']}")

    return {"passed": passed, "summary": summary}
