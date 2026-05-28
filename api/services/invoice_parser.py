"""
Invoice / PO Parser — Zero-KYC document extraction.

Pipeline (cheapest first):
  1. pdfplumber → extract text from digital PDFs (FREE, no LLM)
  2. pytesseract → OCR for scanned/image PDFs (FREE, local)
  3. Ollama llama3.2:3b → structured extraction from raw text (FREE, local)
  4. Claude Vision (future) → for complex layouts when available

Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
  Windows: choco install tesseract  OR  download installer from above link
"""
from __future__ import annotations
import json
import re
import io
from pathlib import Path
from typing import Optional

from api.models.schemas import InvoiceParseResult
from api.services.gst_verifier import extract_gstin_from_text


EXTRACTION_SYSTEM = """You are a precise B2B invoice data extractor for Indian MSMEs.
Extract the following fields from the invoice text and return ONLY valid JSON.
If a field is not found, use null.

Return format:
{
  "gstin": "15-char GSTIN or null",
  "company_name": "company name or null",
  "invoice_number": "invoice number or null",
  "invoice_date": "DD/MM/YYYY or null",
  "total_amount": numeric value or null,
  "line_items": [
    {"description": "item name", "quantity": numeric, "unit": "string", "rate": numeric, "amount": numeric}
  ]
}"""


def extract_text_with_pdfplumber(file_bytes: bytes) -> tuple[str, str]:
    """Extract text from digital PDF. Returns (text, method_used)."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            full_text = "\n".join(pages)
            if len(full_text.strip()) > 50:
                return full_text, "pdfplumber"
    except ImportError:
            import logging
            logging.getLogger("api.invoice").warning("pdfplumber not installed. pip install pdfplumber")
    except Exception as e:
            logging.getLogger("api.invoice").exception("pdfplumber error: %s", e)
    return "", "none"


def extract_text_with_tesseract(file_bytes: bytes) -> tuple[str, str]:
    """OCR for scanned PDFs using Tesseract. Returns (text, method_used)."""
    try:
        import pytesseract
        from PIL import Image
        import fitz  # pymupdf

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        all_text = []
        for page_num in range(min(len(doc), 5)):  # Max 5 pages
            page = doc[page_num]
            mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))
            text = pytesseract.image_to_string(img, lang="eng+hin")
            all_text.append(text)
        return "\n".join(all_text), "tesseract"
    except ImportError:
           import logging
           logging.getLogger("api.invoice").warning("pytesseract/pymupdf not installed. pip install pytesseract pymupdf Pillow")
    except Exception as e:
           logging.getLogger("api.invoice").exception("Tesseract error: %s", e)
    return "", "none"


def extract_fields_with_regex(text: str) -> dict:
    """Fast regex extraction for common Indian invoice patterns (no LLM needed)."""
    result = {}

    # GSTIN (15 chars)
    gstins = extract_gstin_from_text(text)
    if gstins:
        result["gstin"] = gstins[0]

    # Total amount patterns
    amount_patterns = [
        r"(?:total|grand total|net amount|invoice total)[:\s]+(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)",
        r"(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:only|/-)",
    ]
    for pat in amount_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                result["total_amount"] = float(m.group(1).replace(",", ""))
                break
            except ValueError:
                pass

    # Invoice number
    inv_match = re.search(r"(?:invoice|bill|tax invoice)\s*(?:no\.?|number|#)[:\s]*([A-Z0-9\-/]+)", text, re.IGNORECASE)
    if inv_match:
        result["invoice_number"] = inv_match.group(1).strip()

    # Date
    date_match = re.search(r"(?:date|dated)[:\s]*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})", text, re.IGNORECASE)
    if date_match:
        result["invoice_date"] = date_match.group(1)

    return result


async def extract_with_llm(raw_text: str) -> dict:
    """Use Ollama llama3.2:3b to extract structured data from invoice text."""
    from api.services.llm_router import smart_call

    # Truncate to avoid context overflow (3B model has 4K context)
    truncated = raw_text[:3000] if len(raw_text) > 3000 else raw_text

    prompt = f"""Extract invoice data from this text:

{truncated}

Return JSON only."""

    result_str = await smart_call(
        task="extract",
        prompt=prompt,
        system=EXTRACTION_SYSTEM,
        json_output=True,
        max_tokens=512,
    )

    try:
        return json.loads(result_str)
    except (json.JSONDecodeError, ValueError):
        return {}


async def parse_invoice(file_bytes: bytes, filename: str = "") -> InvoiceParseResult:
    """
    Full pipeline: PDF → text → regex → LLM → structured result.
    Tries cheapest method first.
    """
    # Step 1: Extract raw text
    raw_text, method = extract_text_with_pdfplumber(file_bytes)

    if not raw_text.strip():
        raw_text, method = extract_text_with_tesseract(file_bytes)

    if not raw_text.strip():
        return InvoiceParseResult(
            raw_text="",
            confidence=0.0,
            parser_used="failed",
        )

    # Step 2: Fast regex extraction
    regex_fields = extract_fields_with_regex(raw_text)

    # Step 3: LLM extraction to fill gaps
    llm_fields = {}
    if not regex_fields.get("gstin") or not regex_fields.get("total_amount"):
        llm_fields = await extract_with_llm(raw_text)

    # Merge: regex takes priority (more reliable), LLM fills gaps
    merged = {**llm_fields, **{k: v for k, v in regex_fields.items() if v}}

    # Confidence score
    found = sum(1 for k in ["gstin", "total_amount", "invoice_number", "invoice_date"] if merged.get(k))
    confidence = found / 4.0

    return InvoiceParseResult(
        raw_text=raw_text[:500],  # Store first 500 chars
        gstin=merged.get("gstin"),
        company_name=merged.get("company_name"),
        invoice_number=merged.get("invoice_number"),
        invoice_date=merged.get("invoice_date"),
        total_amount=merged.get("total_amount"),
        line_items=merged.get("line_items", []),
        confidence=confidence,
        parser_used=f"{method}+llm" if llm_fields else method,
    )
