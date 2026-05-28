"""
LLM Router — Smart routing between local Ollama and cloud providers.
Strategy (Ruflo-inspired):
  - Simple tasks (JSON extraction, classification) → Ollama llama3.2:3b (FREE)
  - Complex tasks (negotiation reasoning, multi-step) → Claude Haiku (cheap with caching)
  - High-speed burst → Groq (when configured)

On your 16GB RAM + Iris Xe laptop:
  - Ollama runs CPU-only (no GPU support for Iris Xe in Ollama)
  - llama3.2:3b: ~2GB RAM, ~8-15 tok/sec on CPU → fast enough for all simulation tasks
  - Install: ollama pull llama3.2:3b
"""
from __future__ import annotations
import json
import time
import asyncio
import httpx
from typing import Optional, Any

from api.config import get_settings


SYSTEM_PROMPT_CACHE: dict[str, str] = {}  # Ruflo-style prompt caching


async def call_ollama(
    prompt: str,
    system: str = "",
    model: Optional[str] = None,
    temperature: float = 0.1,
    max_tokens: int = 1024,
) -> str:
    """Call local Ollama. Returns empty string on failure (graceful degradation)."""
    settings = get_settings()
    model = model or settings.OLLAMA_MODEL
    payload = {
        "model": model,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "num_ctx": 4096,
        },
    }
    try:
        async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
            resp = await client.post(f"{settings.OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
    except Exception as e:
        import logging
        logging.getLogger("api.llm").exception("Ollama error calling %s: %s", model, e)
        return ""


async def call_claude(
    prompt: str,
    system: str = "",
    max_tokens: int = 1024,
) -> str:
    """Call Claude Haiku via Anthropic API. Returns empty string if not configured."""
    settings = get_settings()
    if not settings.ANTHROPIC_API_KEY:
        import logging
        logging.getLogger("api.llm").warning("Claude API key not set. Falling back to Ollama.")
        return await call_ollama(prompt, system, max_tokens=max_tokens)
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        messages = [{"role": "user", "content": prompt}]
        resp = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=system or "You are a helpful B2B marketplace assistant for Indian MSMEs.",
            messages=messages,
        )
        return resp.content[0].text.strip()
    except Exception as e:
        import logging
        logging.getLogger("api.llm").error("Claude error: %s. Falling back to Ollama.", e)
        return await call_ollama(prompt, system, max_tokens=max_tokens)


async def call_openai(
    prompt: str,
    system: str = "",
    model: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 1024,
    response_format: Optional[dict] = None,
) -> str:
    """Call OpenAI API. Falls back to local Ollama if not configured."""
    settings = get_settings()
    api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
    if not api_key:
        import os
        api_key = os.environ.get("OPENAI_API_KEY", "")

    if not api_key:
        import logging
        logging.getLogger("api.llm").warning("OpenAI API key not set. Falling back to Ollama.")
        return await call_ollama(prompt, system, max_tokens=max_tokens)

    model = model or getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")
    try:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system or "You are a precise B2B marketplace advisor."},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
            )
            resp.raise_for_status()
            res_json = resp.json()
            return res_json["choices"][0]["message"]["content"].strip()
    except Exception as e:
        import logging
        logging.getLogger("api.llm").error("OpenAI error: %s. Falling back to Ollama.", e)
        return await call_ollama(prompt, system, max_tokens=max_tokens)


async def smart_call(
    task: str,
    prompt: str,
    system: str = "",
    json_output: bool = False,
    max_tokens: int = 512,
) -> str:
    """
    Route to cheapest capable model based on task complexity.

    task categories:
      "extract"     → Ollama (JSON extraction from text)
      "classify"    → Ollama (simple classification)
      "translate"   → Sarvam AI or Ollama
      "negotiate"   → Claude Haiku (complex reasoning) or Ollama fallback
      "summarize"   → Ollama
    """
    settings = get_settings()
    start = time.monotonic()

    if json_output and not system:
        system = "You are a precise data extractor. Always respond with valid JSON only, no explanation."

    # Route decision
    use_cloud = (
        settings.LLM_MODE == "claude"
        or (settings.LLM_MODE == "auto" and task in ("negotiate", "complex"))
    ) and bool(settings.ANTHROPIC_API_KEY)

    if use_cloud:
        result = await call_claude(prompt, system, max_tokens=max_tokens)
    else:
        result = await call_ollama(prompt, system, max_tokens=max_tokens)

    elapsed_ms = int((time.monotonic() - start) * 1000)

    # Log to DB (non-blocking)
    asyncio.create_task(_log_llm_call(
        provider="claude" if use_cloud else "ollama",
        model=settings.CLAUDE_MODEL if use_cloud else settings.OLLAMA_MODEL,
        task=task,
        elapsed_ms=elapsed_ms,
    ))

    if json_output:
        return _extract_json(result)
    return result


def _extract_json(text: str) -> str:
    """Extract JSON block from LLM output, handling markdown code fences."""
    import re
    # Try to extract from ```json ... ``` block
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if match:
        return match.group(1).strip()
    # Try to find first { or [
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start = text.find(start_char)
        if start != -1:
            depth = 0
            for i, ch in enumerate(text[start:]):
                if ch == start_char:
                    depth += 1
                elif ch == end_char:
                    depth -= 1
                    if depth == 0:
                        return text[start:start + i + 1]
    return text


async def _log_llm_call(provider: str, model: str, task: str, elapsed_ms: int):
    """Async log to Supabase (fire and forget)."""
    try:
        from db.supabase_client import get_supabase
        db = get_supabase()
        db.table("llm_calls").insert({
            "provider": provider,
            "model": model,
            "task": task,
            "latency_ms": elapsed_ms,
            "cost_usd": 0.0 if provider == "ollama" else 0.0001,
        }).execute()
    except Exception:
        pass  # Never let logging break the main flow


async def check_ollama_available() -> bool:
    """Check if Ollama is running locally."""
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            models = resp.json().get("models", [])
            names = [m["name"] for m in models]
            print(f"[Ollama] Available models: {names}")
            return any(settings.OLLAMA_MODEL in n for n in names)
    except Exception:
        return False
