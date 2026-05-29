import asyncio
import sys
import json
from pathlib import Path

# Setup path
_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from simulation.negotiation.protocols import NegotiationSession, run_negotiation
from simulation.negotiation.event_sourced_ledger import EventSourcedJournal, reconstruct_session_state

async def verify_ledger():
    print("==============================================================")
    print("VERIFYING PACT EVENT-SOURCED LEDGER & REPLAY DETERMINISM...")
    print("==============================================================\n")

    # 1. Initialize session and journal
    journal = EventSourcedJournal()
    session = NegotiationSession(
        session_id="VERIFY-SESSION-2026",
        buyer_id="B-VERIFY",
        seller_id="S-VERIFY",
        seller_name="Verify-Seller",
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
        journal=journal
    )

    # 2. Run the active negotiation
    print("Step 1: Running active negotiation session...")
    original_deal = await run_negotiation(session)
    print(f"  Deal Reached: {original_deal.deal_reached}")
    print(f"  Final Price:  Rs.{original_deal.final_price:.2f}")
    print(f"  Rounds Taken: {original_deal.negotiation_rounds}")
    print(f"  Close Reason: {original_deal.close_reason}")

    # 3. Export events to json string and reload
    print("\nStep 2: Exporting transaction log to JSON and reloading journal...")
    json_data = journal.to_json()
    print(f"  Journal Event Count: {len(journal.events)}")
    print(f"  Serialized Size: {len(json_data)} bytes")
    
    # Verify we got events
    assert len(journal.events) > 0, "No events captured in journal!"

    reloaded_journal = EventSourcedJournal.from_json(json_data)
    print(f"  Reloaded Event Count: {len(reloaded_journal.events)}")
    assert len(reloaded_journal.events) == len(journal.events), "Reloaded event count mismatch!"

    # 4. Reconstruct session from reloaded journal
    print("\nStep 3: Replaying transaction stream to reconstruct session...")
    empty_session = NegotiationSession(
        session_id="VERIFY-SESSION-2026",
        buyer_id="",
        seller_id="",
        seller_name="Verify-Seller",
        buyer_target_price=0.0,
        buyer_max_price=0.0,
        buyer_quantity=0,
        seller_floor_price=0.0,
        seller_list_price=0.0,
        seller_moq=0,
        category=""
    )
    
    reconstructed = reconstruct_session_state(
        session_id="VERIFY-SESSION-2026",
        journal=reloaded_journal,
        empty_session=empty_session
    )

    # 5. Assert 100% equivalence (determinism verification)
    print("\nStep 4: Running bit-for-bit determinism validation assertions...")
    
    assert reconstructed.buyer_id == session.buyer_id
    assert reconstructed.seller_id == session.seller_id
    assert reconstructed.buyer_target_price == session.buyer_target_price
    assert reconstructed.buyer_max_price == session.buyer_max_price
    assert reconstructed.buyer_quantity == session.buyer_quantity
    assert reconstructed.seller_floor_price == session.seller_floor_price
    assert reconstructed.seller_list_price == session.seller_list_price
    assert len(reconstructed.offers) == len(session.offers)
    
    for i, (orig_offer, rep_offer) in enumerate(zip(session.offers, reconstructed.offers)):
        assert orig_offer.price == rep_offer.price
        assert orig_offer.from_agent == rep_offer.from_agent
        assert orig_offer.round_number == rep_offer.round_number

    assert reconstructed.deal is not None
    assert reconstructed.deal.deal_reached == original_deal.deal_reached
    assert reconstructed.deal.final_price == original_deal.final_price
    assert reconstructed.deal.quantity == original_deal.quantity
    assert reconstructed.deal.delivery_days == original_deal.delivery_days
    assert reconstructed.deal.payment_term == original_deal.payment_term
    assert reconstructed.deal.negotiation_rounds == original_deal.negotiation_rounds
    assert reconstructed.deal.close_reason == original_deal.close_reason

    print("\n==============================================================")
    print("SUCCESS: 100% Deterministic Event Replay Validated! Zero Drift.")
    print("==============================================================")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_ledger())
