"""
Sarvam AI — Indian vernacular translation stub.
STUB until Sarvam API key is configured.
When ready: set SARVAM_API_KEY in .env

Supported languages (Sarvam AI):
  hi (Hindi), bn (Bengali), te (Telugu), mr (Marathi), ta (Tamil),
  gu (Gujarati), kn (Kannada), ml (Malayalam), pa (Punjabi), or (Odia)

For now: passes text through unchanged (English is the default),
with Ollama-based Hindi translation as a free fallback.
"""
from __future__ import annotations
import httpx
from typing import Optional
import logging

logger = logging.getLogger("api.sarvam")


SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/translate"

# Language name → Sarvam API code
LANG_MAP = {
    "hindi": "hi-IN",
    "bengali": "bn-IN",
    "telugu": "te-IN",
    "marathi": "mr-IN",
    "tamil": "ta-IN",
    "gujarati": "gu-IN",
    "kannada": "kn-IN",
    "malayalam": "ml-IN",
    "punjabi": "pa-IN",
    "odia": "or-IN",
    "english": "en-IN",
}


async def translate(
    text: str,
    target_lang: str = "hindi",
    source_lang: str = "english",
) -> str:
    """
    Translate text to an Indian language.
    Returns original text if translation fails or is not configured.
    """
    from api.config import get_settings
    settings = get_settings()

    target_code = LANG_MAP.get(target_lang.lower(), "hi-IN")
    source_code = LANG_MAP.get(source_lang.lower(), "en-IN")

    # Same language? Pass through.
    if target_code == source_code:
        return text

    if settings.SARVAM_API_KEY:
        return await _translate_via_sarvam(text, source_code, target_code, settings.SARVAM_API_KEY)

    # Free fallback: Ollama basic translation
    return await _translate_via_ollama(text, target_lang)


async def _translate_via_sarvam(
    text: str, source: str, target: str, api_key: str
) -> str:
    """Live Sarvam AI translation."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                SARVAM_TRANSLATE_URL,
                json={
                    "input": text,
                    "source_language_code": source,
                    "target_language_code": target,
                    "speaker_gender": "Male",
                    "mode": "formal",
                    "model": "mayura:v1",
                    "enable_preprocessing": True,
                },
                headers={
                    "api-subscription-key": api_key,
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("translated_text", text)
    except Exception as e:
        logger.exception("Sarvam translation error: %s", e)
        return text


async def _translate_via_ollama(text: str, target_lang: str) -> str:
    """Ollama-based translation fallback (free, lower quality)."""
    try:
        from api.services.llm_router import call_ollama
        prompt = (
            f"Translate the following business message to {target_lang}. "
            f"Return ONLY the translated text, nothing else.\n\n{text}"
        )
        result = await call_ollama(prompt, system="You are a professional translator.", max_tokens=512)
        return result.strip() if result else text
    except Exception:
        return text


async def detect_language(text: str) -> str:
    """
    Naive language detection: checks for common Devanagari/regional script chars.
    Returns 'hindi', 'english', or 'unknown'.
    """
    devanagari_chars = sum(1 for c in text if "\u0900" <= c <= "\u097F")
    if devanagari_chars > len(text) * 0.2:
        return "hindi"
    return "english"


def format_hinglish_greeting(buyer_name: str, company_name: str) -> str:
    """
    Hinglish version of the Aha Moment greeting (no API needed).
    Mix of Hindi and English common in Indian business WhatsApp.
    """
    return (
        f"Namaste {buyer_name} ji!\n\n"
        f"*{company_name}* ke liye main suppliers dhundh raha hoon.\n\n"
        f"Best deals 30-60 seconds mein aapke paas bhejunga.\n\n"
        f"Thoda intezaar karein..."
    )
