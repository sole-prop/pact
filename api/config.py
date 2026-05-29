"""
Central configuration via environment variables.
Copy .env.example → .env and fill in your values.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────
    APP_NAME: str = "A2A B2B Marketplace API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    PLATFORM_FEE_PCT: float = 0.01          # 1% Veritus Ventures fee

    # ── Ollama (local, free) ─────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"       # Primary local model
    OLLAMA_VISION_MODEL: str = "moondream"  # Lightweight vision model (1.8B)
    OLLAMA_TIMEOUT: int = 120               # seconds

    # ── Anthropic Claude (production, optional) ──────────────────────────
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-haiku-4-5-20251001"

    # ── OpenAI (premium analysis, optional) ──────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ── Groq (fast inference fallback, optional) ─────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # ── LLM Routing ──────────────────────────────────────────────────────
    LLM_MODE: str = "ollama"  # ollama | claude | groq

    # ── Supabase ─────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""  # service_role key (NOT anon key)
    SUPABASE_ANON_KEY: str = ""

    # ── WhatsApp Business Cloud API (Meta) ───────────────────────────────
    WHATSAPP_TOKEN: str = ""            # Bearer token from Meta developer console
    WHATSAPP_PHONE_NUMBER_ID: str = ""  # From Meta → WhatsApp → Phone Numbers
    WHATSAPP_VERIFY_TOKEN: str = "veritus_verify_2024"  # Your webhook verify token
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = ""

    # ── Sarvam AI (vernacular translation) ───────────────────────────────
    SARVAM_API_KEY: str = ""
    SARVAM_BASE_URL: str = "https://api.sarvam.ai"

    # ── GST / Government APIs ─────────────────────────────────────────────
    # For production, register at https://www.gst.gov.in/developer
    GST_API_KEY: str = ""
    GST_API_BASE: str = "https://api.gst.gov.in/commonapi/v1.1"
    # Free fallback (no auth): GSTIN format validation + state extraction
    USE_GST_MOCK: bool = True   # Set False when you have a real GST API key

    # ── Razorpay (payment / nodal account) ───────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_NODAL_ACCOUNT_ID: str = ""
    USE_PAYMENT_MOCK: bool = True   # Set False when Razorpay is configured
    BASE_URL: str = "http://localhost:8000"

    # ── WhatsApp security ─────────────────────────────────────────────────
    WHATSAPP_APP_SECRET: str = ""   # App secret for X-Hub-Signature-256 validation

    # ── Redis (distributed cache, Phase 2) ───────────────────────────────
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    USE_REDIS_MOCK: bool = True

    # ── Event Streams (Phase 2.5) ────────────────────────────────────────
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    USE_KAFKA_MOCK: bool = True

    # ── Negotiation defaults ─────────────────────────────────────────────
    MAX_NEGOTIATION_ROUNDS: int = 5
    MAX_CONCURRENT_NEGOTIATIONS: int = 100
    NEGOTIATION_TIMEOUT_SECONDS: float = 30.0
    TOP_N_RESULTS: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
