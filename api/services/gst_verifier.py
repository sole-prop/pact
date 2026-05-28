"""
GST Verifier — validates GSTIN and fetches business details.

3 modes (configured by USE_GST_MOCK in .env):
  1. Format validation only (always works, no API needed)
  2. Mock response (USE_GST_MOCK=True, for development)
  3. Real GST API (USE_GST_MOCK=False, requires GST_API_KEY)

GSTIN format: SS PPPPP NNNN E Z C
  SS = State code (2 digits)
  PPPPP = PAN (5 letters)
  NNNN = PAN numeric (4 digits)
  E = PAN entity (1 letter)
  Z = Always 'Z'
  C = Check digit (alphanumeric)
"""
from __future__ import annotations
import re
import httpx
from typing import Optional

from api.models.schemas import GSTVerifyResponse
import logging

logger = logging.getLogger("api.gst")


# State code → state name mapping (India)
STATE_CODES: dict[str, str] = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
    "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "25": "Daman & Diu", "26": "Dadra & Nagar Haveli",
    "27": "Maharashtra", "28": "Andhra Pradesh (old)",
    "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
    "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
    "35": "Andaman & Nicobar", "36": "Telangana", "37": "Andhra Pradesh",
    "38": "Ladakh",
}

GSTIN_PATTERN = re.compile(
    r"^([0-9]{2})([A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})$"
)

# Mock company database (used when USE_GST_MOCK=True)
MOCK_COMPANIES: dict[str, dict] = {
    "27": {"company_name": "Sample Maharashtra MSME Pvt Ltd", "director_name": "Ramesh Patel"},
    "33": {"company_name": "Tamil Nadu Traders Pvt Ltd", "director_name": "Selvam Kumar"},
    "24": {"company_name": "Gujarat Exports Pvt Ltd", "director_name": "Hasmukh Shah"},
    "07": {"company_name": "Delhi Manufacturing Co", "director_name": "Suresh Verma"},
    "29": {"company_name": "Karnataka Tech Components", "director_name": "Ravi Murthy"},
}


def validate_gstin_format(gstin: str) -> tuple[bool, str, str]:
    """
    Returns (is_valid, state_code, state_name).
    Pure format validation — no API call needed.
    """
    gstin = gstin.strip().upper()
    match = GSTIN_PATTERN.match(gstin)
    if not match:
        return False, "", ""
    state_code = match.group(1)
    state_name = STATE_CODES.get(state_code, "Unknown State")
    return True, state_code, state_name


async def verify_gstin(gstin: str) -> GSTVerifyResponse:
    """
    Full GSTIN verification. Uses mock or real API depending on USE_GST_MOCK setting.
    """
    from api.config import get_settings
    settings = get_settings()

    gstin = gstin.strip().upper()
    valid, state_code, state_name = validate_gstin_format(gstin)

    if not valid:
        return GSTVerifyResponse(
            gstin=gstin,
            valid_format=False,
            state_code="",
            state_name="",
            source="format_validation",
        )

    if settings.USE_GST_MOCK:
        return _mock_gst_response(gstin, state_code, state_name)

    return await _real_gst_api(gstin, state_code, state_name, settings)


def _mock_gst_response(gstin: str, state_code: str, state_name: str) -> GSTVerifyResponse:
    """Return a realistic mock response for development/testing."""
    mock = MOCK_COMPANIES.get(state_code, {
        "company_name": f"MSME Enterprise (GSTIN: {gstin[:10]}...)",
        "director_name": "Director Name (Mock)",
    })
    # Extract PAN-based entity name hint
    pan_part = gstin[2:12]
    return GSTVerifyResponse(
        gstin=gstin,
        valid_format=True,
        state_code=state_code,
        state_name=state_name,
        company_name=mock["company_name"],
        director_name=mock["director_name"],
        registration_date="2019-04-01",
        taxpayer_type="Regular",
        source="mock",
    )


async def _real_gst_api(gstin: str, state_code: str, state_name: str, settings) -> GSTVerifyResponse:
    """
    Call real GST API.
    Register at: https://www.gst.gov.in/developer to get API credentials.
    Alternative free APIs: https://apisetu.gov.in/
    """
    headers = {
        "Authorization": f"Bearer {settings.GST_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{settings.GST_API_BASE}/search",
                params={"action": "TradeName", "gstin": gstin},
                headers=headers,
            )
            data = resp.json()
            # Parse response (structure varies by API provider)
            return GSTVerifyResponse(
                gstin=gstin,
                valid_format=True,
                state_code=state_code,
                state_name=state_name,
                company_name=data.get("tradeNam") or data.get("lgnm"),
                director_name=data.get("pradr", {}).get("addr", {}).get("nm"),
                registration_date=data.get("rgdt"),
                taxpayer_type=data.get("dty"),
                source="gst_api",
            )
    except Exception as e:
        logger.exception("GST API error: %s", e)
        return GSTVerifyResponse(
            gstin=gstin,
            valid_format=True,
            state_code=state_code,
            state_name=state_name,
            source="format_validation",
        )


def extract_gstin_from_text(text: str) -> list[str]:
    """Extract all GSTINs found in a block of text (from invoice OCR)."""
    return list(set(GSTIN_PATTERN.findall_strings(text) if hasattr(GSTIN_PATTERN, 'findall_strings')
                    else re.findall(r'\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b', text.upper())))
