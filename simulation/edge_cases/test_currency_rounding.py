"""
Edge Case 17: CURRENCY ROUNDING ERRORS
INR paisa rounding causing acceptance/rejection at exact boundary prices.
Expected: Floating-point rounding handled consistently; no deal accepted above buyer_max.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.negotiation.protocols import NegotiationSession, run_negotiation
from decimal import Decimal, ROUND_HALF_UP


def round_inr(amount: float) -> float:
    """Round to nearest paisa (2 decimal places) using banker's rounding."""
    return float(Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


async def run(verbose=False) -> dict:
    # Boundary case: buyer max = 5000.00, seller floor = 4999.999999 (float imprecision)
    tricky_floor = 4999.999999  # Effectively 5000 but floats are tricky
    buyer_max = 5000.00

    session = NegotiationSession(
        session_id="rounding-test",
        buyer_id="BROUND", seller_id="SROUND", seller_name="Rounding Seller",
        max_rounds=3, timeout_seconds=10.0,
        buyer_target_price=4800.0, buyer_max_price=buyer_max,
        buyer_quantity=100, buyer_deadline_days=14,
        buyer_payment_pref="net_30", buyer_quality_min="B",
        buyer_strategy="conceder",
        seller_floor_price=tricky_floor,
        seller_list_price=5500.0,
        seller_moq=10, seller_max_qty=5000,
        seller_quality="B",
        seller_delivery_min=5, seller_delivery_max=14,
        seller_payment_terms=["net_30"],
        seller_strategy="conceder",
        seller_stock=1000,
    )

    deal = await run_negotiation(session)

    # Verify: final price (if deal reached) must not exceed buyer_max
    price_ok = not deal.deal_reached or deal.final_price <= buyer_max + 0.005  # tolerance
    rounded_price = round_inr(deal.final_price) if deal.deal_reached else 0.0

    # Also test explicit rounding
    rounding_cases = [
        (4999.995, 5000.00),
        (4999.994, 4999.99),
        (5000.005, 5000.01),
        (100.1 + 100.2, 200.30),  # Classic float trap
    ]
    rounding_correct = all(
        round_inr(inp) == expected
        for inp, expected in rounding_cases
    )

    passed = price_ok and rounding_correct
    summary = (
        f"Rounding test: floor=₹{tricky_floor}, max=₹{buyer_max}. "
        f"Deal: {deal.deal_reached}, price=₹{rounded_price}. "
        f"All rounding cases correct: {rounding_correct}."
    )
    if verbose:
        for inp, expected in rounding_cases:
            got = round_inr(inp)
            ok = got == expected
            print(f"  round_inr({inp}) = {got} (expected {expected}) {'✓' if ok else '✗'}")

    return {"passed": passed, "summary": summary}
