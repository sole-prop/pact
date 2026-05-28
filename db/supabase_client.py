"""
Supabase client — singleton connection used across the API.
Falls back gracefully to a mock DB if SUPABASE_URL is not set (for local testing).
"""
from __future__ import annotations
import json
from typing import Optional, Any


_client = None


def get_supabase():
    """Return Supabase client. Call once per request (FastAPI dependency injection)."""
    global _client
    if _client is not None:
        return _client

    from api.config import get_settings
    settings = get_settings()

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        print("[WARNING] SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Using MockDB.")
        _client = MockDB()
        return _client

    try:
        from supabase import create_client, Client
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        print(f"[DB] Connected to Supabase: {settings.SUPABASE_URL}")
        return _client
    except ImportError:
        print("[WARNING] supabase package not installed. pip install supabase. Using MockDB.")
        _client = MockDB()
        return _client


class MockDB:
    """
    In-memory mock database for local development without Supabase credentials.
    Stores data in dicts; data is lost on restart.
    """
    _is_mock: bool = True

    def __init__(self):
        self._tables: dict[str, list[dict]] = {
            "sellers": [], "buyers": [], "negotiation_sessions": [],
            "deals": [], "transactions": [], "onboarding_sessions": [],
            "whatsapp_messages": [], "llm_calls": [],
        }
        print("[MockDB] Running in-memory mock DB. Set SUPABASE_URL to use real DB.")

    def table(self, name: str) -> "MockTable":
        if name not in self._tables:
            self._tables[name] = []
        return MockTable(self._tables[name], name)


class MockTable:
    def __init__(self, data: list[dict], name: str):
        self._data = data
        self._name = name
        self._filters: list[tuple] = []
        self._limit_n: Optional[int] = None
        self._order_col: Optional[str] = None

    def insert(self, record: dict) -> "MockTable":
        import uuid
        if "id" not in record:
            record["id"] = str(uuid.uuid4())
        from datetime import datetime
        if "created_at" not in record:
            record["created_at"] = datetime.now().isoformat()
        self._data.append(record)
        self._pending = [record]
        return self

    def select(self, cols: str = "*") -> "MockTable":
        self._pending = list(self._data)
        return self

    def eq(self, col: str, val: Any) -> "MockTable":
        self._filters.append(("eq", col, val))
        return self

    def limit(self, n: int) -> "MockTable":
        self._limit_n = n
        return self

    def order(self, col: str, desc: bool = False) -> "MockTable":
        self._order_col = (col, desc)
        return self

    def upsert(self, record: dict) -> "MockTable":
        import uuid
        from datetime import datetime
        pk = record.get("id")
        for existing in self._data:
            if pk and existing.get("id") == pk:
                existing.update(record)
                self._pending = [existing]
                return self
        if "id" not in record:
            record["id"] = str(uuid.uuid4())
        if "created_at" not in record:
            record["created_at"] = datetime.now().isoformat()
        self._data.append(record)
        self._pending = [record]
        return self

    def update(self, data: dict) -> "MockTable":
        for row in self._data:
            if all(row.get(c) == v for _, c, v in self._filters):
                row.update(data)
        return self

    def execute(self):
        result = list(self._data)
        for op, col, val in self._filters:
            if op == "eq":
                result = [r for r in result if r.get(col) == val]
        if self._order_col:
            col, desc = self._order_col
            result.sort(key=lambda r: r.get(col, ""), reverse=desc)
        if self._limit_n:
            result = result[:self._limit_n]
        return MockResult(result)


class MockResult:
    def __init__(self, data: list):
        self.data = data
        self.error = None
