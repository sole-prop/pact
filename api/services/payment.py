"""
Razorpay Route — Nodal account / platform fee split.
STUB until Razorpay Route is configured.
When ready: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env

Revenue model (Veritus Ventures):
  - 1% platform fee on every deal (only on success)
  - Nodal account receives full order value
  - Razorpay Route splits: 99% → seller, 1% → platform
  - Section 79 IT Act: marketplace not liable for seller content

Flow (Phase 2 production):
  1. Buyer selects deal via WhatsApp list reply
  2. Platform generates Razorpay Payment Link for full order value
  3. Buyer pays → funds land in nodal account
  4. Platform triggers Route transfer: 99% to seller, keeps 1%
  5. Seller ships → eway bill generated
  6. Dispute window: 3 days post delivery
"""
from __future__ import annotations
import uuid
from typing import Optional


PLATFORM_FEE_PCT = 0.01   # 1%
GST_ON_FEE_PCT   = 0.18   # 18% GST on platform fee (charged to seller)


def calculate_fee_breakdown(order_value: float) -> dict:
    """
    Calculate all monetary amounts for a transaction.
    Returns dict with platform_fee, gst_on_fee, seller_payout.
    """
    platform_fee = round(order_value * PLATFORM_FEE_PCT, 2)
    gst_on_fee   = round(platform_fee * GST_ON_FEE_PCT, 2)
    seller_payout = round(order_value - platform_fee - gst_on_fee, 2)
    return {
        "order_value":    order_value,
        "platform_fee":   platform_fee,
        "gst_on_fee":     gst_on_fee,
        "seller_payout":  seller_payout,
        "platform_fee_pct": PLATFORM_FEE_PCT,
    }


async def create_payment_link(
    order_value: float,
    buyer_name: str,
    buyer_phone: str,
    session_id: str,
    description: str = "B2B Order via Veritus Ventures",
) -> dict:
    """
    Create a Razorpay Payment Link for the buyer.
    Returns {success, payment_link_url, payment_link_id, stub}
    """
    from api.config import get_settings
    settings = get_settings()

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        # STUB MODE
        stub_link_id = f"plink_stub_{uuid.uuid4().hex[:12]}"
        stub_url = f"https://rzp.io/stub/{stub_link_id}"
        print(f"[Payment STUB] Would create payment link: Rs.{order_value:,.2f} for {buyer_name}")
        return {
            "success": True,
            "payment_link_url": stub_url,
            "payment_link_id": stub_link_id,
            "stub": True,
        }

    # LIVE MODE
    return await _create_razorpay_link(
        order_value, buyer_name, buyer_phone, session_id, description, settings
    )


async def _create_razorpay_link(
    order_value: float,
    buyer_name: str,
    buyer_phone: str,
    session_id: str,
    description: str,
    settings,
) -> dict:
    """Live Razorpay Payment Link creation."""
    import httpx
    try:
        amount_paise = int(order_value * 100)
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.razorpay.com/v1/payment_links",
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                json={
                    "amount": amount_paise,
                    "currency": "INR",
                    "description": description,
                    "customer": {
                        "name": buyer_name,
                        "contact": buyer_phone,
                    },
                    "notify": {"sms": True, "email": False},
                    "reminder_enable": True,
                    "notes": {"session_id": session_id},
                    "callback_url": f"{settings.BASE_URL}/api/payment/callback",
                    "callback_method": "get",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "success": True,
                "payment_link_url": data.get("short_url"),
                "payment_link_id": data.get("id"),
                "stub": False,
            }
    except Exception as e:
        print(f"[Payment] Razorpay error: {e}")
        return {"success": False, "payment_link_url": None, "payment_link_id": None, "error": str(e)}


async def trigger_route_transfer(
    payment_link_id: str,
    seller_account_id: str,
    order_value: float,
    session_id: str,
) -> dict:
    """
    After payment captured: split via Razorpay Route.
    99% → seller linked account, 1% → platform.
    """
    from api.config import get_settings
    settings = get_settings()

    breakdown = calculate_fee_breakdown(order_value)

    if not settings.RAZORPAY_KEY_ID:
        print(f"[Payment STUB] Would route Rs.{breakdown['seller_payout']:,.2f} to seller {seller_account_id}")
        return {"success": True, "stub": True, "breakdown": breakdown}

    # TODO: implement live Razorpay Route transfer
    # Requires fetching payment_id from payment_link, then POST /v1/transfers
    return {"success": True, "stub": True, "breakdown": breakdown, "note": "Live route not yet implemented"}


async def log_transaction(
    session_id: str,
    deal_id: str,
    order_value: float,
    payment_link_id: Optional[str],
    status: str = "pending",
) -> None:
    """Persist transaction record to Supabase."""
    try:
        from db.supabase_client import get_supabase
        breakdown = calculate_fee_breakdown(order_value)
        db = get_supabase()
        db.table("transactions").insert({
            "session_id": session_id,
            "deal_id": deal_id,
            "order_value": order_value,
            "platform_fee_pct": breakdown["platform_fee_pct"],
            "platform_fee": breakdown["platform_fee"],
            "gst_on_fee": breakdown["gst_on_fee"],
            "supplier_payout": breakdown["seller_payout"],
            "razorpay_payment_link_id": payment_link_id,
            "status": status,
        }).execute()
    except Exception:
        pass
