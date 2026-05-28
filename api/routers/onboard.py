"""
Zero-KYC Onboarding Router.

POST /api/onboard/start        — register phone number (buyer or seller)
POST /api/onboard/verify-gst   — validate GSTIN, return company details
POST /api/onboard/upload-invoice — upload PDF, extract invoice data, trigger Aha Moment
GET  /api/onboard/session/{id} — check session status

The "Aha Moment" flow:
  1. Buyer uploads invoice PDF via WhatsApp or API
  2. pdfplumber / Tesseract OCR extracts text
  3. Regex + Ollama extracts GSTIN, company name, invoice amount
  4. GST API (or mock) verifies the GSTIN → returns director name, company name
  5. Bot sends personalised WhatsApp greeting using real company data
  6. Session created in DB → buyer now identified without any signup
"""
from __future__ import annotations
import uuid
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse

from api.models.schemas import (
    OnboardRequest,
    GSTVerifyRequest,
    GSTVerifyResponse,
    InvoiceParseResult,
)

router = APIRouter(prefix="/api/onboard", tags=["onboarding"])


@router.post("/start")
async def start_onboarding(req: OnboardRequest):
    """
    Register a WhatsApp number and role (buyer/seller).
    Creates or fetches an onboarding session.
    """
    session_id = str(uuid.uuid4())
    try:
        from db.supabase_client import get_supabase
        db = get_supabase()
        db.table("onboarding_sessions").insert({
            "id": session_id,
            "whatsapp_number": req.whatsapp_number,
            "role": req.role,
            "status": "started",
            "onboarded_via": "api",
        }).execute()
    except Exception:
        pass  # MockDB or no DB — continue anyway

    return {
        "session_id": session_id,
        "status": "started",
        "message": "Send your invoice/PO as a PDF to proceed with Zero-KYC onboarding.",
        "whatsapp_number": req.whatsapp_number,
        "role": req.role,
    }


@router.post("/verify-gst", response_model=GSTVerifyResponse)
async def verify_gst(req: GSTVerifyRequest):
    """
    Validate a GSTIN and return company details.
    Always works for format validation; uses mock or real API based on config.
    """
    from api.services.gst_verifier import verify_gstin
    result = await verify_gstin(req.gstin)
    if not result.valid_format:
        raise HTTPException(status_code=422, detail=f"Invalid GSTIN format: {req.gstin}")
    return result


@router.post("/upload-invoice")
async def upload_invoice(
    file: UploadFile = File(...),
    whatsapp_number: str = Form(...),
    session_id: str = Form(default=""),
):
    """
    Upload a PDF invoice or Purchase Order.
    Extracts GSTIN + company + amount → triggers Aha Moment WhatsApp message.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB).")

    # Parse invoice
    from api.services.invoice_parser import parse_invoice
    parse_result: InvoiceParseResult = await parse_invoice(file_bytes, file.filename)

    if parse_result.confidence < 0.25:
        return JSONResponse(status_code=422, content={
            "success": False,
            "message": "Could not extract data from this PDF. Please try a clearer scan.",
            "confidence": parse_result.confidence,
        })

    # Verify GSTIN if found
    gst_info = None
    if parse_result.gstin:
        from api.services.gst_verifier import verify_gstin
        gst_info = await verify_gstin(parse_result.gstin)

    # Create / update onboarding session
    if not session_id:
        session_id = str(uuid.uuid4())

    try:
        from db.supabase_client import get_supabase
        db = get_supabase()
        db.table("onboarding_sessions").upsert({
            "id": session_id,
            "whatsapp_number": whatsapp_number,
            "role": "buyer",
            "gstin": parse_result.gstin,
            "company_name": gst_info.company_name if gst_info else parse_result.company_name,
            "invoice_amount": parse_result.total_amount,
            "status": "invoice_uploaded",
            "onboarded_via": "api",
        }).execute()
    except Exception:
        pass

    # Send Aha Moment notification (demo mode)
    wa_result = None
    if gst_info and gst_info.company_name and parse_result.total_amount:
        from api.services.notification import send_message, format_aha_moment_message
        msg = format_aha_moment_message(
            company_name=gst_info.company_name,
            director_name=gst_info.director_name or "Director",
            invoice_amount=parse_result.total_amount,
            gstin=parse_result.gstin or "",
        )
        wa_result = await send_message(whatsapp_number, msg)

    return {
        "success": True,
        "session_id": session_id,
        "parse_result": {
            "gstin": parse_result.gstin,
            "company_name": gst_info.company_name if gst_info else parse_result.company_name,
            "invoice_number": parse_result.invoice_number,
            "invoice_date": parse_result.invoice_date,
            "total_amount": parse_result.total_amount,
            "confidence": parse_result.confidence,
            "parser_used": parse_result.parser_used,
        },
        "gst_verified": gst_info.valid_format if gst_info else False,
        "aha_moment_sent": bool(wa_result and wa_result.get("success")),
        "notification_stub": wa_result.get("stub") if wa_result else True,
    }


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Check onboarding session status."""
    try:
        from db.supabase_client import get_supabase
        db = get_supabase()
        result = db.table("onboarding_sessions").select("*").eq("id", session_id).execute()
        rows = result.data if hasattr(result, "data") else []
        if not rows:
            raise HTTPException(status_code=404, detail="Session not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception:
        return {
            "id": session_id,
            "status": "unknown",
            "message": "DB not connected — running in stub mode",
        }
