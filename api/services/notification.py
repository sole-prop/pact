"""
Internal notification service (demo mode).
Replaces WhatsApp-specific sender with a lightweight notifier that logs
and optionally persists notifications to the DB. Keeps the same
formatting helpers so existing callers only need to change import path.
"""
from __future__ import annotations
import json
import logging
from typing import Optional

from api.models.schemas import DealResult

logger = logging.getLogger("api.notification")


def format_top10_list_message(
    deals: list[DealResult],
    buyer_name: str,
    category: str,
    session_id: str,
) -> dict:
    # Reuse same payload shape as WhatsApp interactive list for compatibility
    rows = []
    for deal in deals[:10]:
        price_str = f"Rs.{deal.final_price:,.0f}"
        delivery_str = f"{deal.delivery_days}d"
        quality = deal.quality_grade
        tag = (deal.narrative.split("|")[1].strip() if "|" in deal.narrative else "").strip()

        rows.append({
            "id": f"deal_{session_id}_{deal.rank}",
            "title": f"#{deal.rank} {price_str}/u {quality}",
            "description": f"{delivery_str} delivery | {deal.payment_term} | {tag or 'Good deal'}",
        })

    return {
        "type": "interactive",
        "interactive": {
            "type": "list",
            "header": {"type": "text", "text": f"Top {len(deals)} {category} Suppliers"},
            "body": {
                "text": (
                    f"Hi {buyer_name}, I negotiated with {len(deals)} suppliers.\n\n"
                    f"Here are your best options. Tap to select:"
                )
            },
            "footer": {"text": "Veritus Ventures | 1% platform fee only on success"},
            "action": {
                "button": "View Suppliers",
                "sections": [
                    {
                        "title": "Ranked by price, quality & delivery",
                        "rows": rows,
                    }
                ],
            },
        },
    }


def format_aha_moment_message(
    company_name: str,
    director_name: str,
    invoice_amount: float,
    gstin: str,
) -> dict:
    return {
        "type": "text",
        "text": {
            "body": (
                f"Namaste! I can see you're from *{company_name}*.\n\n"
                f"Your invoice for *Rs.{invoice_amount:,.2f}* is verified. "
                f"GSTIN: {gstin[:6]}...{gstin[-4:]}\n\n"
                f"I'm now searching for the best suppliers for you. "
                f"This usually takes 30-60 seconds.\n\n"
                f"Please hold on..."
            )
        },
    }


def format_deal_locked_message(deal: DealResult, session_id: str, platform_fee: float) -> dict:
    order_value = deal.final_price * deal.quantity
    fee = order_value * platform_fee
    return {
        "type": "text",
        "text": {
            "body": (
                f"*Contract Locked!*\n\n"
                f"Supplier: {deal.seller_name}\n"
                f"Price: Rs.{deal.final_price:,.2f}/unit x {deal.quantity} units\n"
                f"Order value: Rs.{order_value:,.2f}\n"
                f"Delivery: {deal.delivery_days} days\n"
                f"Payment: {deal.payment_term}\n\n"
                f"Platform fee (1%): Rs.{fee:,.2f}\n\n"
                f"Reference: {session_id[:8].upper()}\n\n"
                f"Payment link will be sent shortly."
            )
        },
    }


async def send_message(to: str, message_payload: dict, log_to_db: bool = True) -> dict:
    """Demo sender: logs the message and persists a notification record if DB exists."""
    logger.info("[Notification] To=%s Payload=%s", to, json.dumps(message_payload)[:200])

    if log_to_db:
        try:
            from db.supabase_client import get_supabase
            db = get_supabase()
            db.table("notifications").insert({
                "to": to,
                "payload": message_payload,
                "status": "stub_sent",
            }).execute()
        except Exception:
            logger.debug("Could not log notification to DB (running in stub mode)")

    return {"success": True, "message_id": "STUB_MSG_ID", "stub": True}


async def send_text(to: str, text: str) -> dict:
    return await send_message(to, {"type": "text", "text": {"body": text}})
