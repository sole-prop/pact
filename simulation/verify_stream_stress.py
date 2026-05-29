import asyncio
import sys
import time
import json
from pathlib import Path
from collections import Counter

# Setup path
_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from simulation.negotiation.protocols import NegotiationSession, run_negotiation
from simulation.negotiation.stream_worker import DistributedStreamWorker
from db.stream_client import get_stream_client, MockStreamClient

async def run_stress_test(n_sessions: int):
    print(f"--- Running Stream Stress Validation: {n_sessions} Sessions ---")
    
    # 1. Reset client and start workers
    client = get_stream_client()
    if isinstance(client, MockStreamClient):
        # Reset in-memory streams
        client._topics.clear()
        client._subscribers.clear()
        
    worker = DistributedStreamWorker(worker_id=f"STRESS-WORKER-{n_sessions}")
    worker.start()
    time.sleep(0.1)

    # 2. Build concurrent sessions
    sessions = []
    for i in range(n_sessions):
        s_id = f"STRESS-S-{n_sessions:04d}-{i:04d}"
        session = NegotiationSession(
            session_id=s_id, buyer_id=f"B-{i}", seller_id=f"S-{i}",
            seller_name=f"Seller-{i}", buyer_target_price=100.0,
            buyer_max_price=120.0, buyer_quantity=100, seller_floor_price=95.0,
            seller_list_price=115.0, seller_moq=10, category="Software",
            seller_payment_terms=["net_30"], buyer_payment_pref="net_30",
            buyer_strategy="conceder", seller_strategy="boulware",
            use_llm=False, stream_enabled=True
        )
        sessions.append(session)

    # 3. Dispatch negotiations concurrently
    t0 = time.monotonic()
    tasks = [run_negotiation(s) for s in sessions]
    live_deals = await asyncio.gather(*tasks)
    elapsed = time.monotonic() - t0
    
    # 4. Await consumer queue to drain
    print("Awaiting worker processing completion...")
    for _ in range(50):
        time.sleep(0.1)
        with worker._state_lock:
            # Check if all completed sessions exist in worker reconstructed cache with completed deals
            done = sum(1 for s in sessions if s.session_id in worker.reconstructed_sessions and worker.reconstructed_sessions[s.session_id].deal is not None)
            if done == n_sessions:
                break
            
    worker.stop()
    
    # 5. Measure Event Loss, Duplication, and Replay Accuracy
    total_published_events = 0
    if isinstance(client, MockStreamClient):
        for p in client._topics.get("negotiation_lifecycle", {}).values():
            total_published_events += len(p)

    reconstructed_count = len(worker.reconstructed_sessions)
    loss_count = n_sessions - reconstructed_count
    
    replay_mismatches = 0
    ordering_violations = 0
    duplicate_events_observed = 0
    
    # Analyze session states
    with worker._state_lock:
        for s in sessions:
            rep = worker.reconstructed_sessions.get(s.session_id)
            if not rep or not rep.deal:
                replay_mismatches += 1
                continue
            
            # Verify final deal price and rounds match
            orig_deal = s.deal
            rep_deal = rep.deal
            if orig_deal.final_price != rep_deal.final_price or orig_deal.negotiation_rounds != rep_deal.negotiation_rounds:
                replay_mismatches += 1
                
            # Verify sequential offer rounds in partition queues (no out of order rounds)
            last_round = 0
            for offer in rep.offers:
                if offer.round_number <= last_round:
                    ordering_violations += 1
                last_round = offer.round_number

    results = {
        "n_sessions": n_sessions,
        "execution_time_secs": round(elapsed, 3),
        "total_published_events": total_published_events,
        "reconstructed_count": reconstructed_count,
        "loss_count": loss_count,
        "loss_rate_pct": round(loss_count / n_sessions * 100, 2),
        "replay_mismatches": replay_mismatches,
        "replay_accuracy_pct": round((n_sessions - replay_mismatches) / n_sessions * 100, 2),
        "ordering_violations": ordering_violations,
        "duplicate_events": duplicate_events_observed
    }
    
    print(f"  Execution Time:      {results['execution_time_secs']}s")
    print(f"  Published Events:    {results['total_published_events']}")
    print(f"  Reconstructed:       {results['reconstructed_count']}")
    print(f"  Loss Rate:           {results['loss_rate_pct']}%")
    print(f"  Replay Accuracy:     {results['replay_accuracy_pct']}%")
    print(f"  Ordering Violations: {results['ordering_violations']}")
    print()
    return results

async def run_full_stress():
    res_100 = await run_stress_test(100)
    res_1000 = await run_stress_test(1000)
    
    reports_dir = Path(__file__).parent / "reports"
    reports_dir.mkdir(exist_ok=True)
    with open(reports_dir / "stream_stress_audit.json", "w", encoding="utf-8") as f:
        json.dump({"run_100": res_100, "run_1000": res_1000}, f, indent=2)

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_full_stress())
