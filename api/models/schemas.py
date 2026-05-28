"""
Pydantic request/response schemas for the API.
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


# ── Onboarding ────────────────────────────────────────────────────────────────

class OnboardRequest(BaseModel):
    whatsapp_number: str = Field(..., example="+919876543210")
    role: str = Field("buyer", example="buyer")  # buyer | seller

class GSTVerifyRequest(BaseModel):
    gstin: str = Field(..., min_length=15, max_length=15, example="27AABCU9603R1ZM")

class GSTVerifyResponse(BaseModel):
    gstin: str
    valid_format: bool
    state_code: str
    state_name: str
    company_name: Optional[str] = None
    director_name: Optional[str] = None
    registration_date: Optional[str] = None
    taxpayer_type: Optional[str] = None
    source: str = "format_validation"  # format_validation | gst_api | mock


# ── Negotiation ───────────────────────────────────────────────────────────────

class NegotiateRequest(BaseModel):
    buyer_id: str = Field(..., example="B001")
    required_category: str = Field(..., example="steel_raw")
    quantity_units: int = Field(..., gt=0, example=200)
    target_price_per_unit: float = Field(..., gt=0, example=5000.0)
    max_price_per_unit: float = Field(..., gt=0, example=6500.0)
    quality_min: str = Field("B", example="B")
    delivery_deadline_days: int = Field(30, gt=0, example=21)
    payment_preference: str = Field("net_30", example="net_30")
    required_certifications: list[str] = Field(default_factory=list)
    blacklisted_sellers: list[str] = Field(default_factory=list)
    top_n: int = Field(10, ge=1, le=20)

class DealResult(BaseModel):
    rank: int
    seller_id: str
    seller_name: str
    final_price: float
    quantity: int
    quality_grade: str
    delivery_days: int
    payment_term: str
    composite_score: float
    narrative: str
    gst_inclusive_price: Optional[float] = None

class NegotiateResponse(BaseModel):
    session_id: str
    buyer_id: str
    status: str
    sellers_queried: int
    deals_reached: int
    deals_failed: int
    top_deals: list[DealResult]
    failure_summary: dict
    shortlist_text: str
    duration_seconds: float


# ── WhatsApp ──────────────────────────────────────────────────────────────────

class WAIncomingMessage(BaseModel):
    """Parsed inbound WhatsApp message from Meta webhook."""
    wa_message_id: str
    from_number: str
    message_type: str       # text | document | interactive | list_reply | image
    text: Optional[str] = None
    document_url: Optional[str] = None
    document_mime: Optional[str] = None
    document_filename: Optional[str] = None
    list_reply_id: Optional[str] = None
    list_reply_title: Optional[str] = None
    timestamp: Optional[str] = None


# ── Invoice Parsing ───────────────────────────────────────────────────────────

class InvoiceParseResult(BaseModel):
    raw_text: str
    gstin: Optional[str] = None
    company_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    total_amount: Optional[float] = None
    line_items: list[dict] = Field(default_factory=list)
    confidence: float = 0.0
    parser_used: str = "pdfplumber"  # pdfplumber | tesseract | ollama_vision


# ── Live Negotiation (dashboard buyer form) ───────────────────────────────────

VALID_CATEGORIES = {
    "software_dev", "creative_design", "digital_marketing", "customer_support",
    "hr_recruitment", "legal_compliance", "financial_audit", "business_consulting",
    "logistics_fleet", "corporate_training",
}

VALID_PAYMENT_TERMS = {"net_60", "net_30", "net_15", "advance_50", "advance_100"}
VALID_QUALITY_GRADES = {"A", "B", "C"}
VALID_URGENCY_LEVELS = {"low", "normal", "high", "urgent"}

INDIAN_STATES = [
    "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]


class BuyerNegotiationRequest(BaseModel):
    """Request schema for live buyer negotiation from the dashboard form."""
    category: str = Field(..., example="steel_raw")
    quantity: int = Field(..., gt=0, le=100000, example=500)
    target_price: float = Field(..., gt=0, example=5000.0)
    max_price: float = Field(..., gt=0, example=6500.0)
    quality_min: str = Field("B", example="B")
    deadline_days: int = Field(30, gt=0, le=365, example=21)
    payment_preference: str = Field("net_30", example="net_30")
    urgency_level: str = Field("normal", example="normal")
    location_state: str = Field("Maharashtra", example="Maharashtra")
    buyer_name: Optional[str] = Field(None, example="My Company Pvt Ltd")


class LiveDealResult(BaseModel):
    """A single deal result for the live negotiation response."""
    rank: int
    seller_id: str
    seller_name: str
    category: str
    final_price: float
    quantity: int
    quality_grade: str
    delivery_days: int
    payment_term: str
    composite_score: float
    savings_pct: float
    vs_list_pct: float
    narrative: str
    close_reason: str
    moq_waiver: bool = False
    volume_discount: float = 0.0
    partial_fulfillment: bool = False
    llm_tokens: int = 0
    batna_used: bool = False
    multi_dim_trade: str = ""


class LiveNegotiationResponse(BaseModel):
    """Response from the live negotiation endpoint."""
    session_id: Optional[str] = None
    buyer_name: str
    category: str
    sellers_queried: int
    deals_found: int
    top_deals: list[LiveDealResult]
    duration_seconds: float
    sentinel_alerts: int = 0


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    ollama_available: bool
    supabase_connected: bool
    whatsapp_configured: bool
    timestamp: str
