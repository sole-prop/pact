"""
Negotiation Router — bridges Phase 1 simulation engine with Phase 2 API.

POST /api/negotiate          — run a full negotiation session, return top-N deals
POST /api/negotiate/select   — buyer selects a deal → lock contract + payment link
GET  /api/negotiate/{session_id} — fetch session results

The simulation engine (Phase 1) is imported directly — no separate process.
"""
from __future__ import annotations
import uuid
import time
import asyncio
import sys
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from api.models.schemas import NegotiateRequest, NegotiateResponse, DealResult

# Add project root to path so simulation package can be imported
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

router = APIRouter(prefix="/api/negotiate", tags=["negotiation"])


@router.post("", response_model=NegotiateResponse)
async def negotiate(req: NegotiateRequest):
    """
    Run a negotiation session.

    Loads all sellers matching `required_category` from mock data (or DB),
    runs the Phase 1 buyer agent, returns ranked top-N deals.
    """
    session_id = str(uuid.uuid4())
    start = time.time()

    try:
        from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
        from simulation.agents.seller_agent import SellerAgent
        import json

        sellers_path = PROJECT_ROOT / "simulation" / "data" / "mock_sellers.json"

        # Load sellers from mock data (use thread to avoid blocking event loop)
        def _sync_load_json(p):
            with open(p, encoding="utf-8") as f:
                return json.load(f)

        sellers_data = await asyncio.to_thread(_sync_load_json, sellers_path)

        # Filter by category + build SellerAgent objects
        sellers = [
            SellerAgent(**{
                "id": s["id"],
                "name": s["name"],
                "category": s["category"],
                "location_state": s["location_state"],
                "gstin": s["gstin"],
                "is_msme_registered": s.get("is_msme_registered", True),
                "floor_price_per_unit": s["floor_price_per_unit"],
                "list_price_per_unit": s["list_price_per_unit"],
                "moq": s["moq"],
                "max_order_qty": s.get("max_order_qty", 10000),
                "quality_grade": s["quality_grade"],
                "quality_certifications": s.get("quality_certifications", []),
                "delivery_days_min": s["delivery_days_min"],
                "delivery_days_max": s["delivery_days_max"],
                "payment_terms_accepted": s["payment_terms_accepted"],
                "negotiation_strategy": s.get("negotiation_strategy", "conceder"),
                "max_discount_pct": s.get("max_discount_pct", 10.0),
                "current_stock_units": s.get("current_stock_units", 1000),
                "rating": s.get("rating", 4.0),
                "total_orders_completed": s.get("total_orders_completed", 50),
                "whatsapp_number": s.get("whatsapp_number", ""),
            })
            for s in sellers_data
            if s["category"] == req.required_category
            and s["id"] not in req.blacklisted_sellers
        ]

        if not sellers:
            raise HTTPException(
                status_code=404,
                detail=f"No sellers found for category '{req.required_category}'",
            )

        # Build buyer requirements
        buyer_req = BuyerRequirements(
            id=req.buyer_id,
            name=f"Buyer {req.buyer_id}",
            location_state="",
            required_category=req.required_category,
            quantity_units=req.quantity_units,
            target_price_per_unit=req.target_price_per_unit,
            max_price_per_unit=req.max_price_per_unit,
            quality_min=req.quality_min,
            delivery_deadline_days=req.delivery_deadline_days,
            payment_preference=req.payment_preference,
            required_certifications=req.required_certifications,
            blacklisted_sellers=req.blacklisted_sellers,
        )

        agent = BuyerAgent(buyer_req, top_n=req.top_n)
        top_deals, all_deals = await agent.negotiate_with_all(sellers)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Negotiation engine error: {e}")

    duration = round(time.time() - start, 2)
    deals_reached = sum(1 for d in all_deals if d.deal_reached)
    deals_failed = len(all_deals) - deals_reached

    # Convert to API schema
    top_deal_results = [
        DealResult(
            rank=d.rank,
            seller_id=d.seller_id,
            seller_name=d.seller_name,
            final_price=d.final_price,
            quantity=d.quantity,
            quality_grade=d.quality_grade,
            delivery_days=d.delivery_days,
            payment_term=d.payment_term,
            composite_score=d.composite_score,
            narrative=d.narrative,
        )
        for d in top_deals
    ]

    # Failure summary
    failure_counts: dict = {}
    for d in all_deals:
        if not d.deal_reached:
            reason = getattr(d, "failure_reason", "unknown")
            failure_counts[reason] = failure_counts.get(reason, 0) + 1

    # Build shortlist text
    from simulation.negotiation.ranking import format_shortlist
    shortlist_text = format_shortlist(top_deals) if top_deals else "No deals found."

    # Persist session to DB
    try:
        from db.supabase_client import get_supabase
        db = get_supabase()
        db.table("negotiation_sessions").insert({
            "id": session_id,
            "buyer_id": req.buyer_id,
            "category": req.required_category,
            "quantity_units": req.quantity_units,
            "target_price": req.target_price_per_unit,
            "max_price": req.max_price_per_unit,
            "sellers_queried": len(all_deals),
            "deals_reached": deals_reached,
            "deals_failed": deals_failed,
            "top_n": req.top_n,
            "status": "completed",
            "duration_seconds": duration,
        }).execute()
    except Exception:
        pass

    return NegotiateResponse(
        session_id=session_id,
        buyer_id=req.buyer_id,
        status="completed",
        sellers_queried=len(all_deals),
        deals_reached=deals_reached,
        deals_failed=deals_failed,
        top_deals=top_deal_results,
        failure_summary=failure_counts,
        shortlist_text=shortlist_text,
        duration_seconds=duration,
    )


@router.post("/select")
async def select_deal(
    session_id: str,
    deal_rank: int,
    buyer_whatsapp: str,
    background_tasks: BackgroundTasks,
):
    """
    Buyer selects a deal from the top-N shortlist.
    Creates contract record and generates payment link.
    """
    try:
        from db.supabase_client import get_supabase
        db = get_supabase()

        # Fetch session
        sess = db.table("negotiation_sessions").select("*").eq("id", session_id).execute()
        if not (hasattr(sess, "data") and sess.data):
            raise HTTPException(status_code=404, detail="Session not found")

        # Fetch deal
        deals = db.table("deals").select("*") \
            .eq("session_id", session_id) \
            .eq("rank", deal_rank).execute()

        if hasattr(deals, "data") and deals.data:
            deal_data = deals.data[0]
        else:
            # DB not populated yet (mock mode) — return stub confirmation
            return {
                "success": True,
                "message": f"Deal rank {deal_rank} selected (stub mode — DB not populated).",
                "session_id": session_id,
                "payment_link": "https://rzp.io/stub/demo",
                "stub": True,
            }

        # Intercept if user seller
        seller_id = deal_data.get("seller_id", "")
        if seller_id and seller_id.startswith("S_USER_"):
            import json
            from datetime import datetime
            notifs_path = PROJECT_ROOT / "simulation" / "data" / "seller_notifications.json"
            notifs_path.parent.mkdir(parents=True, exist_ok=True)
            
            notifs = []
            if notifs_path.exists():
                try:
                    with open(notifs_path, encoding="utf-8") as f:
                        notifs = json.load(f)
                except Exception:
                    pass
            
            # Check if this notification already exists to avoid duplicates
            exists = any(n.get("session_id") == session_id and n.get("deal_rank") == deal_rank for n in notifs)
            if not exists:
                new_notif = {
                    "id": f"N_{str(uuid.uuid4())[:8]}",
                    "session_id": session_id,
                    "deal_rank": deal_rank,
                    "buyer_name": "Enterprise Buyer (Acme)",
                    "seller_id": seller_id,
                    "seller_name": deal_data.get("seller_name", "My Registered Service"),
                    "category": deal_data.get("category", "software_dev"),
                    "final_price": float(deal_data.get("final_price", 0)),
                    "quantity": int(deal_data.get("quantity", 1)),
                    "total_value": float(deal_data.get("final_price", 0)) * int(deal_data.get("quantity", 1)),
                    "quality_grade": deal_data.get("quality_grade", "A"),
                    "delivery_days": int(deal_data.get("delivery_days", 10)),
                    "payment_term": deal_data.get("payment_term", "net_30"),
                    "composite_score": float(deal_data.get("composite_score", 90.0)),
                    "status": "pending",
                    "created_at": datetime.now().isoformat()
                }
                notifs.append(new_notif)
                try:
                    with open(notifs_path, "w", encoding="utf-8") as f:
                        json.dump(notifs, f, indent=2)
                except Exception:
                    pass

        order_value = float(deal_data["final_price"]) * int(deal_data["quantity"])

        # Create payment link
        from api.services.payment import create_payment_link, log_transaction
        pay_result = await create_payment_link(
            order_value=order_value,
            buyer_name="Buyer",
            buyer_phone=buyer_whatsapp,
            session_id=session_id,
            description=f"B2B Order via Veritus Ventures — {deal_data.get('category', '')}",
        )

        # Log transaction
        background_tasks.add_task(
            log_transaction,
            session_id=session_id,
            deal_id=deal_data["id"],
            order_value=order_value,
            payment_link_id=pay_result.get("payment_link_id"),
        )

        # Send confirmation notification (demo mode)
        if buyer_whatsapp:
            from api.services.notification import send_text
            background_tasks.add_task(
                send_text,
                buyer_whatsapp,
                f"*Contract Locked!*\n\nOrder value: Rs.{order_value:,.2f}\n"
                f"Payment link: {pay_result.get('payment_link_url', 'Coming soon')}\n\n"
                f"Reference: {session_id[:8].upper()}",
            )

        return {
            "success": True,
            "session_id": session_id,
            "deal_rank": deal_rank,
            "order_value": order_value,
            "payment_link": pay_result.get("payment_link_url"),
            "payment_link_id": pay_result.get("payment_link_id"),
            "stub": pay_result.get("stub", False),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}")
async def get_session(session_id: str):
    """Fetch negotiation session results."""
    try:
        from db.supabase_client import get_supabase
        db = get_supabase()
        result = db.table("negotiation_sessions").select("*").eq("id", session_id).execute()
        rows = result.data if hasattr(result, "data") else []
        if not rows:
            raise HTTPException(status_code=404, detail="Session not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seller-action")
async def seller_action(req: dict):
    """
    Allow seller to accept or decline a pending deal selection.
    """
    notif_id = req.get("notification_id")
    action = req.get("action")  # "accept" | "decline"
    
    if not notif_id or action not in ("accept", "decline"):
        raise HTTPException(
            status_code=400,
            detail="Invalid parameters. Need notification_id and action ('accept'/'decline')."
        )
        
    try:
        import json
        notifs_path = PROJECT_ROOT / "simulation" / "data" / "seller_notifications.json"
        if not notifs_path.exists():
            raise HTTPException(status_code=404, detail="Notification list not found.")
            
        with open(notifs_path, encoding="utf-8") as f:
            notifs = json.load(f)
            
        found = False
        for n in notifs:
            if n.get("id") == notif_id:
                n["status"] = "accepted" if action == "accept" else "declined"
                found = True
                break
                
        if not found:
            raise HTTPException(status_code=404, detail="Notification not found.")
            
        with open(notifs_path, "w", encoding="utf-8") as f:
            json.dump(notifs, f, indent=2)
            
        return {"success": True, "message": f"Deal selection {action}ed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
