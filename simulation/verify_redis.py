import sys
from pathlib import Path

# Setup path
_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from db.redis_client import get_redis

def verify_redis():
    print("==============================================================")
    print("VERIFYING PACT DISTRIBUTED REDIS STATE CACHE LAYER...")
    print("==============================================================\n")

    # 1. Initialize Redis client (singleton)
    cache = get_redis()
    print(f"  Initialized Cache Client Type: {type(cache).__name__}")
    
    # 2. Test Basic Key-Value Storage
    print("\nStep 1: Testing basic key-value operations...")
    set_ok = cache.set("test_key_2026", "Veritus B2B sovereign contract")
    print(f"  Set Key Status: {set_ok}")
    assert set_ok is True, "Redis SET operation failed!"

    val = cache.get("test_key_2026")
    print(f"  Retrieved Value: '{val}'")
    assert val == "Veritus B2B sovereign contract", "Redis GET value mismatch!"

    # 3. Test Hash Map Operations (Session Context Storage)
    print("\nStep 2: Testing B2B session hash context operations...")
    hset_ok = cache.hset("session:9999", "buyer_id", "B-ENTERPRISE")
    cache.hset("session:9999", "target_price", "105.50")
    cache.hset("session:9999", "status", "negotiating")
    print(f"  HSET buyer_id: {hset_ok}")

    buyer = cache.hget("session:9999", "buyer_id")
    status = cache.hget("session:9999", "status")
    print(f"  HGET buyer_id: '{buyer}'")
    print(f"  HGET status:   '{status}'")
    assert buyer == "B-ENTERPRISE", "Redis HGET buyer_id mismatch!"
    assert status == "negotiating", "Redis HGET status mismatch!"

    all_fields = cache.hgetall("session:9999")
    print(f"  HGETALL Result: {all_fields}")
    assert len(all_fields) == 3, "Redis HGETALL field count mismatch!"

    # 4. Test Event Streams publishing
    print("\nStep 3: Testing event streams publishing...")
    pub_ok = cache.publish("negotiation_events", "Session Started: VERIFY-SESSION-2026")
    print(f"  Publish Status: {pub_ok}")
    assert pub_ok == 1, "Redis PUBLISH operation failed!"

    # 5. Clean up
    print("\nStep 4: Cleaning up cache database...")
    del_ok = cache.delete("test_key_2026")
    del_hash_ok = cache.delete("session:9999")
    print(f"  Deleted test_key: {del_ok}")
    print(f"  Deleted hash:     {del_hash_ok}")
    assert del_ok == 1, "Redis DELETE operation failed!"
    assert del_hash_ok == 1, "Redis hash DELETE failed!"

    print("\n==============================================================")
    print("SUCCESS: Redis state cache validation passed! Zero anomalies.")
    print("==============================================================")

if __name__ == "__main__":
    verify_redis()
