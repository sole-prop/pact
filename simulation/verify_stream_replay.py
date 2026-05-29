import asyncio
import sys
import time
from pathlib import Path

# Setup path
_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from simulation.negotiation.protocols import NegotiationSession, run_negotiation
from simulation.negotiation.stream_worker import DistributedStreamWorker
from db.stream_client import get_stream_client, MockStreamClient

async def verify_stream_replay():
    print("==============================================================")
    print("VERIFYING PACT DISTRIBUTED STREAM REPLAY DETERMINISM...")
    print("==============================================================\n")

    # 1. Initialize Stream Client (Must be MockStreamClient for local audit verification)
    client = get_stream_client()
    print(f"  Stream Client Type: {type(client).__name__}")
    assert isinstance(client, MockStreamClient), "Stream client is not MockStreamClient!"

    # 2. Spin Up Distributed Worker Group
    print("\nStep 1: Starting Distributed Stream Worker...")
    worker = DistributedStreamWorker(worker_id="WORKER-NODE-01")
    worker.start()
    time.sleep(0.1)  # allow loop threads to boot up

    # 3. Create Session with Stream Enabled
    session_id = "STREAM-REPLAY-SESSION-2026"
    session = NegotiationSession(
        session_id=session_id,
        buyer_id="B-STREAMER",
        seller_id="S-STREAMER",
        seller_name="Stream-Seller",
        buyer_target_price=100.0,
        buyer_max_price=120.0,
        buyer_quantity=100,
        seller_floor_price=95.0,
        seller_list_price=115.0,
        seller_moq=10,
        category="Software",
        seller_payment_terms=["net_30"],
        buyer_payment_pref="net_30",
        buyer_strategy="conceder",
        seller_strategy="boulware",
        use_llm=False,
        stream_enabled=True  # Enables Phase B stream publishing hooks!
    )

    # 4. Execute live negotiation
    print("\nStep 2: Executing live negotiation with active stream hooks...")
    live_deal = await run_negotiation(session)
    print(f"  Live Deal Status: {live_deal.deal_reached}")
    print(f"  Live Deal Price:  Rs.{live_deal.final_price:.2f}")
    print(f"  Live Deal Rounds: {live_deal.negotiation_rounds}")
    print(f"  Live Close Reason: {live_deal.close_reason}")

    # 5. Wait for partition queue to drain and process
    print("\nStep 3: Awaiting consumer thread coordination...")
    # Wait up to 2 seconds for worker task processing to complete
    for _ in range(20):
        time.sleep(0.1)
        with worker._state_lock:
            if session_id in worker.reconstructed_sessions and worker.reconstructed_sessions[session_id].deal is not None:
                break

    # 6. Fetch reconstructed session state
    print("\nStep 4: Reconstructing session state from stream partition history...")
    reconstructed = worker.reconstructed_sessions.get(session_id)
    assert reconstructed is not None, "Failed to reconstruct session from stream!"
    
    # 7. Run bit-for-bit equivalence assertions
    print("\nStep 5: Verifying state reconstruction determinism...")
    
    print(f"  Original Offer Count:      {len(session.offers)}")
    print(f"  Reconstructed Offer Count: {len(reconstructed.offers)}")
    assert len(reconstructed.offers) == len(session.offers), "Offer count mismatch!"

    for i, (orig, rep) in enumerate(zip(session.offers, reconstructed.offers)):
        print(f"    Round {orig.round_number} Offer: Original={orig.price} | Replay={rep.price} | Matches: {orig.price == rep.price}")
        assert orig.price == rep.price, f"Offer mismatch at Round {orig.round_number}!"
        assert orig.from_agent == rep.from_agent, "Offer agent mismatch!"

    print(f"\n  Original Deal Reached:      {live_deal.deal_reached}")
    print(f"  Reconstructed Deal Reached: {reconstructed.deal.deal_reached}")
    assert reconstructed.deal.deal_reached == live_deal.deal_reached, "Deal status mismatch!"

    print(f"  Original Final Price:       Rs.{live_deal.final_price:.2f}")
    print(f"  Reconstructed Final Price:  Rs.{reconstructed.deal.final_price:.2f}")
    assert reconstructed.deal.final_price == live_deal.final_price, "Final price mismatch!"

    print(f"  Original Close Reason:      {live_deal.close_reason}")
    print(f"  Reconstructed Close Reason: {reconstructed.deal.close_reason}")
    assert reconstructed.deal.close_reason == live_deal.close_reason, "Close reason mismatch!"

    # Stop worker threads
    worker.stop()

    print("\n==============================================================")
    print("SUCCESS: 100% Deterministic Event Stream Playback Validated!")
    print("==============================================================")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_stream_replay())
