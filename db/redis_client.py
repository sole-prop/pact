"""
Redis client — singleton connection used across the API for distributed state (Phase 2).
Falls back gracefully to a thread-safe MockRedis cache if redis is not installed or mock mode is enabled.
"""
from __future__ import annotations
import json
import logging
import threading
from typing import Optional, Any, Dict

logger = logging.getLogger(__name__)

_redis_client = None
_client_lock = threading.Lock()


def get_redis():
    """Return Redis client singleton. Fully thread-safe."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    with _client_lock:
        if _redis_client is not None:
            return _redis_client

        from api.config import get_settings
        settings = get_settings()

        if settings.USE_REDIS_MOCK:
            logger.info("[Redis] USE_REDIS_MOCK is True. Using in-memory MockRedis.")
            _redis_client = MockRedis()
            return _redis_client

        try:
            import redis
            _redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD or None,
                db=settings.REDIS_DB,
                decode_responses=True
            )
            # Test connection
            _redis_client.ping()
            logger.info(f"[Redis] Connected to live Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
            return _redis_client
        except (ImportError, Exception) as e:
            logger.warning(f"[Redis] Live connection failed or redis-py not installed. Falling back to MockRedis. Error: {e}")
            _redis_client = MockRedis()
            return _redis_client


class MockRedis:
    """
    In-memory, thread-safe mock Redis client.
    Mimics redis-py string, hash, and pub/sub interfaces exactly.
    """
    def __init__(self):
        self._store: Dict[str, str] = {}
        self._hashes: Dict[str, Dict[str, str]] = {}
        self._lock = threading.Lock()
        logger.info("[MockRedis] Running in-memory mock Redis cache.")

    def ping(self) -> bool:
        return True

    def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        with self._lock:
            # Store value serialized as string
            self._store[key] = str(value)
            return True

    def get(self, key: str) -> Optional[str]:
        with self._lock:
            return self._store.get(key)

    def delete(self, key: str) -> int:
        with self._lock:
            if key in self._store:
                del self._store[key]
                return 1
            if key in self._hashes:
                del self._hashes[key]
                return 1
            return 0

    def hset(self, name: str, key: str, value: Any) -> int:
        with self._lock:
            if name not in self._hashes:
                self._hashes[name] = {}
            self._hashes[name][key] = str(value)
            return 1

    def hget(self, name: str, key: str) -> Optional[str]:
        with self._lock:
            return self._hashes.get(name, {}).get(key)

    def hgetall(self, name: str) -> Dict[str, str]:
        with self._lock:
            return dict(self._hashes.get(name, {}))

    def publish(self, channel: str, message: str) -> int:
        # Mock pub/sub triggers logging
        logger.debug(f"[MockRedis Pub] Channel '{channel}' -> {message}")
        return 1
