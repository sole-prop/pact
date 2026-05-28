"""
Edge Case 14: FAKE MSME CERTIFICATION
Seller falsely claims MSME registration to get preferential treatment.
Expected: Validation hook detects mismatch between GSTIN state code and claimed state;
           or MSME cert flag is verified against a mock registry.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from simulation.agents.seller_agent import SellerAgent


# Simplified MSME validation: check GSTIN state code matches location_state
GSTIN_STATE_CODES = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
    "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "27": "Maharashtra", "29": "Karnataka", "32": "Kerala",
    "33": "Tamil Nadu", "36": "Telangana", "37": "Andhra Pradesh",
}


def validate_msme(seller: SellerAgent) -> tuple[bool, str]:
    """Returns (is_valid, reason)."""
    if not seller.is_msme_registered:
        return True, "not_claiming_msme"

    gstin = seller.gstin
    if len(gstin) < 2:
        return False, "invalid_gstin_format"

    state_code = gstin[:2]
    expected_state = GSTIN_STATE_CODES.get(state_code)
    if expected_state is None:
        return False, f"unknown_state_code_{state_code}"

    if expected_state.lower() != seller.location_state.lower():
        return False, f"gstin_state_mismatch: GSTIN says {expected_state}, seller claims {seller.location_state}"

    return True, "valid"


async def run(verbose=False) -> dict:
    # Legitimate MSME seller
    legit_seller = SellerAgent(
        id="SLEGIT", name="Legit MSME Seller", category="steel_raw",
        location_state="Maharashtra",
        gstin="27LEGIT1234F1Z5",  # 27 = Maharashtra ✓
        is_msme_registered=True,
        floor_price_per_unit=5000.0, list_price_per_unit=6000.0,
        moq=10, max_order_qty=1000, quality_grade="B",
        quality_certifications=[], delivery_days_min=5, delivery_days_max=15,
        payment_terms_accepted=["net_30"], negotiation_strategy="boulware",
        max_discount_pct=10.0, current_stock_units=500, rating=4.3,
        total_orders_completed=100, whatsapp_number="",
    )

    # Fake MSME — claims Gujarat but GSTIN is Maharashtra
    fake_seller = SellerAgent(
        id="SFAKE", name="Fake MSME Seller", category="steel_raw",
        location_state="Gujarat",
        gstin="27FAKE01234F1Z5",  # 27 = Maharashtra, but claims Gujarat ✗
        is_msme_registered=True,
        floor_price_per_unit=4500.0, list_price_per_unit=5500.0,
        moq=10, max_order_qty=1000, quality_grade="B",
        quality_certifications=[], delivery_days_min=5, delivery_days_max=15,
        payment_terms_accepted=["net_30"], negotiation_strategy="boulware",
        max_discount_pct=10.0, current_stock_units=500, rating=4.0,
        total_orders_completed=30, whatsapp_number="",
    )

    results = []
    for seller in [legit_seller, fake_seller]:
        valid, reason = validate_msme(seller)
        results.append({"id": seller.id, "valid": valid, "reason": reason})
        if verbose:
            status = "✓ VALID" if valid else "✗ INVALID"
            print(f"  {seller.id}: {status} — {reason}")

    legit_valid = results[0]["valid"] is True
    fake_caught = results[1]["valid"] is False

    passed = legit_valid and fake_caught
    summary = (
        f"MSME validation: legit seller valid={legit_valid}, "
        f"fake seller caught={fake_caught} ({results[1]['reason']})."
    )
    return {"passed": passed, "summary": summary}
