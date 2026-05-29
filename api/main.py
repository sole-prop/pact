"""
Veritus Ventures — A2A Marketplace FastAPI Application.

Run locally:
    uvicorn api.main:app --reload --port 8000

Or via launch.json:
    fastapi-backend config in .claude/launch.json
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from api.config import get_settings
from api.routers import onboard, negotiate, stats

# Configure basic logging for the API
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("api")


# ── Application lifespan ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown tasks."""
    settings = get_settings()

    logger.info("Starting Veritus Ventures — A2A Marketplace API")

    # Check Ollama
    from api.services.llm_router import check_ollama_available
    ollama_ok = await check_ollama_available()
    logger.info("Ollama (%s): %s", settings.OLLAMA_MODEL, "OK" if ollama_ok else "UNAVAILABLE (LLM disabled)")

    # Check Supabase
    try:
        from db.supabase_client import get_supabase
        db = get_supabase()
        supabase_ok = not getattr(db, "_is_mock", True)
        logger.info("Supabase: %s", "OK" if supabase_ok else "MockDB (paste schema.sql into Supabase)")
    except Exception:
        supabase_ok = False
        logger.warning("Supabase: UNAVAILABLE")

    # Check WhatsApp
    # WhatsApp integration removed for demo mode; use internal notifications.
    wa_ok = False
    logger.info("WhatsApp API: removed (demo mode)")

    logger.info("GST Mode: %s", "MOCK" if settings.USE_GST_MOCK else "LIVE")
    logger.info("Payment Mode: %s", "MOCK" if settings.USE_PAYMENT_MOCK else "LIVE")

    yield

    logger.info("[API] Shutting down.")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Veritus Ventures — A2A B2B Marketplace",
    description=(
        "Autonomous agent-to-agent negotiation marketplace for Indian MSMEs.\n\n"
        "**Phase 1**: Simulation engine (pure Python SAO protocol)\n\n"
        "**Phase 2**: FastAPI backend with WhatsApp + Supabase integration\n\n"
        "1% platform fee on successful deals only."
    ),
    version="0.2.0",
    lifespan=lifespan,
)

# ── CORS (restricted: read from env, default to localhost only) ───────────────
# Set ALLOWED_ORIGINS env var for production (comma-separated).
# Example: ALLOWED_ORIGINS=https://app.mycompany.com,https://staging.mycompany.com
_allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000,http://127.0.0.1:3000")
_allowed_origins = [o.strip() for o in _allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)


# ── Simple rate limiting middleware (in-memory, per-IP) ───────────────────────
# For production, replace with Redis-backed slowapi or nginx rate limiting.
_rate_limit_store: dict[str, list[float]] = {}

async def _rate_limit_middleware(request: Request, call_next):
    import time
    # Only rate-limit expensive endpoints
    RATE_LIMITED_PATHS = {"/api/stats/run-stress-test", "/api/stats/run-single"}
    if request.url.path in RATE_LIMITED_PATHS and request.method == "POST":
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0  # 1 minute window
        # Limits per endpoint
        limit = 100 if "stress-test" in request.url.path else 200
        timestamps = _rate_limit_store.get(client_ip, [])
        # Evict old timestamps
        timestamps = [t for t in timestamps if now - t < window]
        if len(timestamps) >= limit:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Rate limit exceeded. Max {limit} requests per minute for {request.url.path}",
                    "retry_after_seconds": int(window - (now - timestamps[0])),
                }
            )
        timestamps.append(now)
        _rate_limit_store[client_ip] = timestamps
    return await call_next(request)

app.middleware("http")(_rate_limit_middleware)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(onboard.router)
app.include_router(negotiate.router)
app.include_router(stats.router)

# ── Static files (dashboard) ──────────────────────────────────────────────────
_static_dir = Path(__file__).parent.parent / "static"
if _static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


# ── Health endpoints ──────────────────────────────────────────────────────────

from fastapi.responses import RedirectResponse

@app.get("/dashboard", tags=["meta"], include_in_schema=False)
async def dashboard():
    """Serve the founder dashboard by redirecting to the Next.js development server."""
    return RedirectResponse(url="http://localhost:3000/dashboard")


@app.get("/", tags=["meta"])
async def root():
    return {
        "service": "Veritus Ventures A2A Marketplace",
        "version": "0.2.0",
        "docs": "/docs",
        "dashboard": "/dashboard",
        "health": "/health",
    }


@app.get("/health", tags=["meta"])
async def health():
    """System health check — useful for monitoring and CI."""
    from api.models.schemas import HealthResponse
    settings = get_settings()

    from api.services.llm_router import check_ollama_available
    ollama_ok = await check_ollama_available()

    try:
        from db.supabase_client import get_supabase
        db = get_supabase()
        supabase_ok = not getattr(db, "_is_mock", True)
    except Exception:
        supabase_ok = False

    wa_configured = bool(settings.WHATSAPP_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID)

    return HealthResponse(
        status="ok",
        version="0.2.0",
        ollama_available=ollama_ok,
        supabase_connected=supabase_ok,
        whatsapp_configured=wa_configured,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
