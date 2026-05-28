"""
Stats & Reporting Router.

GET  /api/stats/latest-report      — latest stress test JSON
GET  /api/stats/run-status         — running state + real-time progress%
GET  /api/stats/stream-progress    — SSE stream: sends progress% every 500ms
POST /api/stats/run-stress-test    — trigger new stress test (background)
POST /api/stats/run-single         — live negotiation from dashboard buyer form
"""
from __future__ import annotations

import asyncio
import json
import sys
import time
import traceback
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import logging

logger = logging.getLogger("api.stats")
from api.models.schemas import BuyerNegotiationRequest, LiveNegotiationResponse, LiveDealResult

router = APIRouter(prefix="/api/stats", tags=["stats"])

REPORTS_DIR = Path(__file__).parent.parent.parent / "simulation" / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# In-process stress test state
_stress_status: dict = {
    "running": False,
    "last_started": None,
    "progress": 0.0,
    "total": 0,
    "last_error": None,
}


@router.get("/latest-report")
async def latest_report():
    """Return the latest stress test report JSON."""
    latest = REPORTS_DIR / "latest.json"
    if not latest.exists():
        raise HTTPException(
            status_code=404,
            detail="No stress test report yet. POST /api/stats/run-stress-test to generate one."
        )

    def _sync_load(p):
        with open(p, encoding="utf-8") as f:
            return json.load(f)

    return await asyncio.to_thread(_sync_load, latest)


@router.get("/run-status")
async def run_status():
    """Check if a stress test is running. Syncs progress from stress_test module."""
    try:
        sys.path.insert(0, str(Path(__file__).parent.parent.parent))
        from simulation.stress_test import _progress_state
        if _progress_state.get("running"):
            _stress_status["progress"] = _progress_state.get("pct", 0.0)
            _stress_status["total"] = _progress_state.get("total", 0)
    except Exception:
        pass
    return _stress_status


@router.get("/stream-progress")
async def stream_progress():
    """
    Server-Sent Events endpoint. Sends progress% every 500ms during stress test.
    Dashboard connects once and receives updates in real-time.
    """
    async def event_generator():
        try:
            sys.path.insert(0, str(Path(__file__).parent.parent.parent))
            from simulation.stress_test import _progress_state
        except Exception:
            _progress_state = _stress_status

        while True:
            pct = _progress_state.get("pct", 0.0)
            running = _progress_state.get("running", False)
            data = json.dumps({
                "pct": pct,
                "running": running,
                "done": _progress_state.get("done", 0),
                "total": _progress_state.get("total", 0),
            })
            yield f"data: {data}\n\n"
            if not running and pct >= 100:
                break
            await asyncio.sleep(0.05)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/run-stress-test")
async def trigger_stress_test(
    background_tasks: BackgroundTasks,
    sector: str = "standard",
    buyers_per_category: int = 10,
    max_rounds: int = 10,
    use_llm: bool = True,
    seed: int = 42,
    infinite_stock: bool = True,
):
    """
    Trigger a new stress test in the background.
    buyers_per_category=10 → 100 buyers × ~100 sellers/cat = ~10K negotiations
    buyers_per_category=100 → ~100K negotiations
    """
    if _stress_status["running"]:
        return JSONResponse({
            "message": "A stress test is already running.",
            "status": _stress_status,
        })

    _stress_status["running"] = True
    _stress_status["last_started"] = datetime.now().isoformat()
    _stress_status["progress"] = 0.0
    _stress_status["last_error"] = None

    background_tasks.add_task(
        _run_stress_background,
        sector=sector,
        buyers_per_category=buyers_per_category,
        max_rounds=max_rounds,
        use_llm=use_llm,
        seed=seed,
        infinite_stock=infinite_stock,
    )

    n_buyers = buyers_per_category * 10
    est_negotiations = n_buyers * 80  # rough estimate
    return {
        "message": f"Stress test started ({sector}): {n_buyers} buyers, ~{est_negotiations:,} negotiations.",
        "sector": sector,
        "use_llm": use_llm,
        "buyers_per_category": buyers_per_category,
        "status": _stress_status,
        "stream": "GET /api/stats/stream-progress",
        "result": "GET /api/stats/latest-report (when done)",
    }


def _run_stress_background(
    sector: str,
    buyers_per_category: int,
    max_rounds: int,
    use_llm: bool,
    seed: int,
    infinite_stock: bool,
):
    """Background thread that runs the full stress test."""
    try:
        sys.path.insert(0, str(Path(__file__).parent.parent.parent))
        if sector == "automotive":
            from simulation.automotive_stress_test import run_automotive_stress_test
            asyncio.run(run_automotive_stress_test(
                n_per_category=buyers_per_category,
                max_rounds=max_rounds,
                verbose=False,
                seed=seed,
                use_llm=use_llm,
                infinite_stock=infinite_stock,
                time_limit_secs=0.0,
            ))
        else:
            from simulation.stress_test import run_stress_test
            asyncio.run(run_stress_test(
                n_per_category=buyers_per_category,
                max_concurrent=80,
                max_rounds=max_rounds,
                verbose=False,
                seed=seed,
                use_llm=use_llm,
                infinite_stock=infinite_stock,
            ))
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("Stress Test ERROR: %s", exc)
        _stress_status["last_error"] = str(exc)
    finally:
        _stress_status["running"] = False
        _stress_status["progress"] = 100.0
        try:
            import simulation.stress_test
            simulation.stress_test._stress_running = False
            simulation.stress_test._progress_state["running"] = False
        except Exception:
            pass


# ── Cached sellers for live negotiation ──────────────────────────────────────
_sellers_cache: dict[str, list] = {}  # category → list[SellerAgent]
_sellers_cache_ts: float = 0.0
_CACHE_TTL: float = 300.0  # 5 minutes


async def _load_sellers_for_category(category: str) -> list:
    """Load sellers for a category from mock_sellers.json, with 5-minute cache.
    Uses a thread to avoid blocking the event loop during file I/O.
    """
    global _sellers_cache_ts
    import time as _time
    if _time.time() - _sellers_cache_ts > _CACHE_TTL:
        _sellers_cache.clear()
        _sellers_cache_ts = _time.time()

    if category not in _sellers_cache:
        data_path = Path(__file__).parent.parent.parent / "simulation" / "data" / "mock_sellers.json"
        if not data_path.exists():
            return []

        def _sync_load(p):
            with open(p, encoding="utf-8") as f:
                return json.load(f)

        sellers_data = await asyncio.to_thread(_sync_load, data_path)
        from simulation.agents.seller_agent import SellerAgent
        by_cat: dict[str, list] = {}
        for s in sellers_data:
            cat = s.get("category", "")
            by_cat.setdefault(cat, []).append(SellerAgent.from_dict(s))
        for cat, agents in by_cat.items():
            _sellers_cache[cat] = agents

    return _sellers_cache.get(category, [])


@router.post("/run-single")
async def run_single_negotiation(req: BuyerNegotiationRequest):
    """
    Live negotiation from the dashboard buyer form.
    Runs the buyer's requirements against all sellers in the category.
    Returns top-10 shortlist + sentinel alerts.

    Input validation: category, quality, payment, urgency are whitelist-checked.
    """
    from api.models.schemas import (
        VALID_CATEGORIES, VALID_QUALITY_GRADES, VALID_PAYMENT_TERMS, VALID_URGENCY_LEVELS,
    )

    # Input validation (whitelist)
    if req.category not in VALID_CATEGORIES:
        raise HTTPException(
            400, f"Invalid category '{req.category}'. Must be one of: {sorted(VALID_CATEGORIES)}"
        )
    if req.quality_min not in VALID_QUALITY_GRADES:
        raise HTTPException(400, f"Invalid quality_min '{req.quality_min}'. Must be A, B, or C.")
    if req.payment_preference not in VALID_PAYMENT_TERMS:
        raise HTTPException(
            400, f"Invalid payment_preference '{req.payment_preference}'."
        )
    if req.urgency_level not in VALID_URGENCY_LEVELS:
        raise HTTPException(
            400, f"Invalid urgency_level '{req.urgency_level}'."
        )
    if req.max_price < req.target_price:
        raise HTTPException(400, "max_price must be >= target_price")
    if req.quantity <= 0:
        raise HTTPException(400, "quantity must be > 0")

    sellers = await _load_sellers_for_category(req.category)
    if not sellers:
        raise HTTPException(
            404,
            f"No sellers found for category '{req.category}'. "
            "Run a stress test first to generate mock data."
        )

    from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
    from simulation.agents.sentinel_agent import SentinelAgent

    buyer_req = BuyerRequirements(
        id="live_user",
        name=req.buyer_name or "Dashboard User",
        location_state=req.location_state,
        required_category=req.category,
        quantity_units=req.quantity,
        target_price_per_unit=req.target_price,
        max_price_per_unit=req.max_price,
        quality_min=req.quality_min,
        delivery_deadline_days=req.deadline_days,
        payment_preference=req.payment_preference,
        urgency_level=req.urgency_level,
        allow_moq_waiver=True,
        allow_partial_fulfillment=True,
    )

    live_sentinel = SentinelAgent()
    agent = BuyerAgent(buyer_req, top_n=10, use_llm=False)

    t0 = time.time()
    top_deals, all_deals = await agent.negotiate_with_all(sellers, sentinel=live_sentinel)
    elapsed = round(time.time() - t0, 3)

    import uuid
    session_id = str(uuid.uuid4())

    for d in all_deals:
      d.category = req.category
      d.buyer_id = "live_user"

    top_results = []
    for deal in top_deals:
      top_results.append(LiveDealResult(
        rank=deal.rank,
        seller_id=deal.seller_id,
        seller_name=deal.seller_name,
        category=req.category,
        final_price=deal.final_price,
        quantity=deal.quantity,
        quality_grade=deal.quality_grade,
        delivery_days=deal.delivery_days,
        payment_term=deal.payment_term,
        composite_score=deal.composite_score,
        savings_pct=round(deal.savings_pct or 0, 2),
        vs_list_pct=round(deal.vs_list_pct or 0, 2),
        narrative=deal.narrative.strip(" |"),
        close_reason=getattr(deal, "close_reason", ""),
        moq_waiver=deal.moq_waiver_applied,
        volume_discount=deal.volume_discount_applied or 0,
        partial_fulfillment=deal.partial_fulfillment,
        llm_tokens=deal.llm_tokens_used or 0,
        batna_used=getattr(deal, "batna_used", False),
        multi_dim_trade=getattr(deal, "multi_dim_trade", ""),
      ))

    sentinel_summary = live_sentinel.get_summary()

    # Persist session and deals to DB so confirm/select and escrow flows function end-to-end
    try:
      from db.supabase_client import get_supabase
      db = get_supabase()
      db.table("negotiation_sessions").insert({
        "id": session_id,
        "buyer_id": "live_user",
        "category": req.category,
        "quantity_units": req.quantity,
        "target_price": req.target_price,
        "max_price": req.max_price,
        "sellers_queried": len(sellers),
        "deals_reached": len([d for d in all_deals if d.deal_reached]),
        "deals_failed": len(sellers) - len([d for d in all_deals if d.deal_reached]),
        "top_n": 10,
        "status": "completed",
        "duration_seconds": elapsed,
      }).execute()

      for deal in top_results:
        db.table("deals").insert({
          "session_id": session_id,
          "rank": deal.rank,
          "seller_id": deal.seller_id,
          "seller_name": deal.seller_name,
          "category": req.category,
          "final_price": deal.final_price,
          "quantity": deal.quantity,
          "quality_grade": deal.quality_grade,
          "delivery_days": deal.delivery_days,
          "payment_term": deal.payment_term,
          "composite_score": deal.composite_score,
          "savings_pct": deal.savings_pct,
          "vs_list_pct": deal.vs_list_pct,
          "narrative": deal.narrative,
        }).execute()
    except Exception as db_exc:
        logger.exception("DB Live negotiation save bypassed/failed: %s", db_exc)

    return LiveNegotiationResponse(
      session_id=session_id,
      buyer_name=buyer_req.name,
      category=req.category,
      sellers_queried=len(sellers),
      deals_found=len([d for d in all_deals if d.deal_reached]),
      top_deals=top_results,
      duration_seconds=elapsed,
      sentinel_alerts=sentinel_summary.get("critical", 0),
    )


    return await asyncio.to_thread(_sync_load, latest)


# ── B2B Seller Portal Endpoints ──────────────────────────────────────────────

@router.post("/optimize-seller-profile")
async def optimize_seller_profile(req: dict):
    """
    OpenAI-driven B2B service positioning optimizer.
    Takes a seller's raw description and details, and returns expert recommendations:
    - suggested pricing structure (list and floor price based on description positioning)
    - math strategy (e.g. tit_for_tat, conceder, boulware)
    - key certifications
    - optimized agent-ready service pitch
    - expert justification
    Consumes extremely few tokens (zero-shot, concise structured JSON).
    """
    desc = req.get("description", "")
    category = req.get("category", "software_dev")
    rating = float(req.get("rating", 4.5))
    orders = int(req.get("total_orders_completed", 10))

    if not desc:
        raise HTTPException(status_code=400, detail="Missing service description.")

    # Craft a tiny, high-performance expert prompt
    system_prompt = (
        "You are an expert B2B Pricing and Sourcing Actuary. Analyze the service description and parameters. "
        "Return a JSON block ONLY (no markdown, no formatting, no intro). "
        "The JSON MUST match this structure: {\n"
        '  "recommended_list_price": <float>,\n'
        '  "recommended_floor_price": <float>,\n'
        '  "recommended_strategy": "conceder"|"tit_for_tat"|"boulware"|"hardball"|"aspirational"|"realistic",\n'
        '  "certifications": [<string>],\n'
        '  "pitch": <string, max 15 words buyer-agent-facing short pitch>,\n'
        '  "justification": <string, max 30 words explanation of why pricing/strategy fit rating & capacity>\n'
        "}"
    )

    prompt = (
        f"Category: {category}\n"
        f"Raw Description: {desc}\n"
        f"Rating: {rating}/5.0\n"
        f"Completed Orders: {orders}\n"
    )

    try:
        from api.services.llm_router import call_openai
        # Call premium OpenAI gpt-4o-mini
        res = await call_openai(prompt=prompt, system=system_prompt, model="gpt-4o-mini", temperature=0.2, max_tokens=300)
        
        # Use our built-in JSON extractor
        from api.services.llm_router import _extract_json
        json_str = _extract_json(res)
        
        # Try to parse it to verify correctness
        parsed = json.loads(json_str)
        return parsed
    except Exception as e:
        logger.warning("OpenAI Profile Optimization error: %s. Loading rule-based backup.", e)
        # Sourcing expert rule-based backup mapping: high-quality, professional, realistic
        defaults = {
            "software_dev": {
                "recommended_list_price": 3200.0,
                "recommended_floor_price": 2200.0,
                "recommended_strategy": "tit_for_tat",
                "certifications": ["SOC2", "CMMI5"],
                "pitch": "Highly-scalable Next.js/FastAPI engineering with dual-layer security standards.",
                "justification": "Premium software engineering with high ratings requires tit_for_tat to protect intellectual margin."
            },
            "creative_design": {
                "recommended_list_price": 65000.0,
                "recommended_floor_price": 45000.0,
                "recommended_strategy": "conceder",
                "certifications": ["DesignAwards"],
                "pitch": "Stunning award-winning UX/UI design systems crafted for hyper-growth enterprises.",
                "justification": "Design sourcing cycles benefit from conceding early to land high-revenue agency retainers."
            },
            "digital_marketing": {
                "recommended_list_price": 55000.0,
                "recommended_floor_price": 40000.0,
                "recommended_strategy": "realistic",
                "certifications": ["GooglePartner"],
                "pitch": "Data-driven SEO retainer audits focused entirely on CAC reduction and organic growth.",
                "justification": "Retainer marketing services require realistic anchoring for high client retention metrics."
            },
            "customer_support": {
                "recommended_list_price": 24000.0,
                "recommended_floor_price": 18000.0,
                "recommended_strategy": "boulware",
                "certifications": ["ISO27001"],
                "pitch": "24/7 omnichannel BPO support specializing in fintech customer support security.",
                "justification": "Support nodes require boulware anchoring to ensure agent overhead costs are covered safely."
            }
        }
        # Get matching category defaults, or general fallback
        fallback = defaults.get(category, {
            "recommended_list_price": 15000.0,
            "recommended_floor_price": 11000.0,
            "recommended_strategy": "conceder",
            "certifications": ["ISO9001"],
            "pitch": f"Expert professional B2B solutions in {category.replace('_', ' ')}.",
            "justification": "Standard professional services margin optimization."
        })
        return fallback


@router.post("/add-seller")
async def add_seller(req: dict):
    """
    Register a new custom seller/service.
    Appends it to simulation/data/mock_sellers.json and invalidates cached sellers.
    """
    try:
        import time as _time
        data_path = Path(__file__).parent.parent.parent / "simulation" / "data" / "mock_sellers.json"
        
        # Load existing sellers
        if data_path.exists():
            def _sync_load(p):
                with open(p, encoding="utf-8") as f:
                    return json.load(f)
            sellers = await asyncio.to_thread(_sync_load, data_path)
        else:
            sellers = []
            
        # Create seller object
        seller_id = f"S_USER_{int(_time.time())}"
        new_seller = {
            "id": seller_id,
            "name": req.get("name", "Custom Seller"),
            "category": req.get("category", "software_dev"),
            "location_state": req.get("location_state", "Maharashtra"),
            "gstin": req.get("gstin", "27AABCU0000A1Z0"),
            "is_msme_registered": req.get("is_msme_registered", True),
            "floor_price_per_unit": float(req.get("floor_price_per_unit", 1000)),
            "list_price_per_unit": float(req.get("list_price_per_unit", 1500)),
            "moq": int(req.get("moq", 1)),
            "max_order_qty": int(req.get("max_order_qty", 10000)),
            "quality_grade": req.get("quality_grade", "A"),
            "quality_certifications": req.get("quality_certifications", []),
            "delivery_days_min": int(req.get("delivery_days_min", 7)),
            "delivery_days_max": int(req.get("delivery_days_max", 30)),
            "payment_terms_accepted": req.get("payment_terms_accepted", ["net_30"]),
            "negotiation_strategy": req.get("negotiation_strategy", "conceder"),
            "max_discount_pct": float(req.get("max_discount_pct", 15.0)),
            "current_stock_units": int(req.get("current_stock_units", 1000)),
            "rating": float(req.get("rating", 5.0)),
            "total_orders_completed": int(req.get("total_orders_completed", 10)),
            "whatsapp_number": req.get("whatsapp_number", "+919876543210"),
            "payment_reliability": 0.95,
            "negotiation_willingness": 0.8,
            "blacklisted_by": []
        }
        
        sellers.append(new_seller)
        
        # Save to mock_sellers.json
        def _sync_save(p, data):
            with open(p, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        await asyncio.to_thread(_sync_save, data_path, sellers)
        
        # Invalidate sellers cache
        global _sellers_cache_ts
        _sellers_cache.clear()
        _sellers_cache_ts = 0.0
        
        # Also upsert into Supabase/MockDB if available
        try:
            from db.supabase_client import get_supabase
            db = get_supabase()
            db.table("sellers").upsert(new_seller).execute()
        except Exception:
            pass
            
        return {"success": True, "seller": new_seller}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Deal Notifications File Helper ───────────────────────────────────────────
NOTIFICATIONS_FILE = Path(__file__).parent.parent.parent / "simulation" / "data" / "seller_notifications.json"

def read_notifications() -> list[dict]:
    if not NOTIFICATIONS_FILE.exists():
        return []
    try:
        with open(NOTIFICATIONS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


@router.get("/seller-notifications")
async def get_seller_notifications(seller_id: Optional[str] = None):
    """
    Get all B2B sourcing notifications for user-registered sellers.
    """
    notifs = read_notifications()
    if seller_id:
        notifs = [n for n in notifs if n.get("seller_id") == seller_id]
    # Sort by created_at desc
    notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return notifs


@router.get("/sellers")
async def get_sellers():
    """
    Get all registered sellers including custom deployed service nodes.
    """
    try:
        data_path = Path(__file__).parent.parent.parent / "simulation" / "data" / "mock_sellers.json"
        if not data_path.exists():
            return []
        with open(data_path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
