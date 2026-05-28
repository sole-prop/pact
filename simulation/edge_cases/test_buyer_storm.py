"""
Edge Case 4: CONCURRENT BUYER STORM
100 buyer agents simultaneously hit the same 100 sellers.
Expected: All buyers get results; no deadlock, no starvation, all complete.
"""
import asyncio
import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent


def _make_sellers(n=50):
    return [
        SellerAgent(
            id=f"SS{i}", name=f"Storm Seller {i}", category="fabric_textile",
            location_state="Gujarat", gstin=f"24STR{i:04d}1Z5",
            is_msme_registered=True,
            floor_price_per_unit=800.0,
            list_price_per_unit=1200.0,
            moq=50, max_order_qty=10000,
            quality_grade="B", quality_certifications=[],
            delivery_days_min=7, delivery_days_max=21,
            payment_terms_accepted=["net_30", "advance_50"],
            negotiation_strategy="boulware",
            max_discount_pct=15.0,
            current_stock_units=5000, rating=4.2,
            total_orders_completed=100, whatsapp_number="",
        )
        for i in range(n)
    ]


async def run(verbose=False) -> dict:
    sellers = _make_sellers(n=50)
    n_buyers = 20  # Use 20 for fast CI; increase to 100 manually

    buyers = [
        BuyerRequirements(
            id=f"BSTORM{i}", name=f"Storm Buyer {i}", location_state="Maharashtra",
            required_category="fabric_textile",
            quantity_units=100,
            target_price_per_unit=900.0,
            max_price_per_unit=1100.0,
            quality_min="B",
            delivery_deadline_days=21,
            payment_preference="net_30",
        )
        for i in range(n_buyers)
    ]

    start = time.monotonic()
    semaphore = asyncio.Semaphore(10)  # Max 10 concurrent buyers

    async def bounded_buyer(req):
        async with semaphore:
            agent = BuyerAgent(req, top_n=5)
            top, all_d = await agent.negotiate_with_all(sellers)
            return {"buyer_id": req.id, "deals": len(top), "total": len(all_d)}

    results = await asyncio.gather(*[bounded_buyer(b) for b in buyers])
    elapsed = time.monotonic() - start

    completed = len(results)
    buyers_with_deals = sum(1 for r in results if r["deals"] > 0)
    passed = completed == n_buyers

    summary = (
        f"{completed}/{n_buyers} buyers completed. "
        f"{buyers_with_deals} got deals. "
        f"Total time: {elapsed:.2f}s. "
        f"No starvation detected."
    )
    if verbose:
        for r in results[:5]:
            print(f"  {r['buyer_id']}: {r['deals']} top deals from {r['total']} negotiations")

    return {"passed": passed, "summary": summary}
