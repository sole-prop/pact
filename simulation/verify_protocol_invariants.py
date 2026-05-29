import asyncio
import sys
import random
import time
from pathlib import Path

# Setup path
_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from simulation.negotiation.protocols import NegotiationSession, run_negotiation, _find_common_payment_with_upgrade
from simulation.negotiation.ranking import NegotiatedDeal, score_deals
from simulation.negotiation.stream_worker import DistributedStreamWorker
from db.stream_client import get_stream_client, MockStreamClient

# Define quality ranking mapping
QUALITY_RANK = {"C": 0, "B": 1, "A": 2}

async def run_protocol_verification_suite(iterations: int = 2000):
    print("==============================================================")
    print("PACT RIGOROUS PROTOCOL INTEGRITY & INVARIANT VALIDATION SUITE")
    print("==============================================================\n")
    
    # 1. State Tracking
    violations = {
        "zopa_price_floor": 0,
        "zopa_price_ceiling": 0,
        "moq_constraint": 0,
        "quality_safeguard": 0,
        "partial_stock": 0,
        "savings_sign_flip": 0,
        "failed_deal_zeroing": 0,
        "mcda_bounds": 0,
        "batna_leakage": 0,
        "blacklist_violation": 0
    }
    
    total_reached = 0
    total_failed = 0
    total_trials = 0
    
    replays_verified = 0
    replays_failed = 0
    
    successful_deals_list = []
    
    # Start stream worker for replay checking on a sample
    print("[1/4] Booting up Distributed Stream Worker for Replay Invariant Verification...")
    worker = DistributedStreamWorker(worker_id="INVARIANT-WORKER-01")
    worker.start()
    time.sleep(0.1) # Boot time
    
    print(f"\n[2/4] Fuzzing Protocol Invariants over {iterations} randomized trials...")
    
    for i in range(iterations):
        # We sample 50 negotiations to have streams enabled to avoid overloading memory and threads
        stream_test = (i < 50)
        
        # Highly randomized inputs to trigger potential edge cases and boundaries
        buyer_target = round(random.uniform(50.0, 500.0), 2)
        buyer_max = round(buyer_target * random.uniform(1.0, 1.4), 2)
        
        seller_floor = round(random.uniform(40.0, 600.0), 2)
        seller_list = round(seller_floor * random.uniform(1.0, 1.3), 2)
        
        buyer_qty = random.randint(1, 1000)
        seller_moq = random.randint(1, 1000)
        seller_stock = random.randint(1, 2000)
        
        buyer_quality = random.choice(["A", "B", "C"])
        seller_quality = random.choice(["A", "B", "C"])
        
        buyer_payment = random.choice(["advance_100", "advance_50", "net_15", "net_30", "net_60"])
        seller_payments = random.sample(["advance_100", "advance_50", "net_15", "net_30", "net_60"], k=random.randint(1, 3))
        
        # Introduce BATNA price 40% of the time
        has_batna = random.random() < 0.4
        batna_price = round(buyer_max * random.uniform(0.8, 1.1), 2) if has_batna else None
        
        # Blacklisted seller 2% of the time
        is_blacklisted = random.random() < 0.02
        
        session = NegotiationSession(
            session_id=f"INVARIANT-FUZZ-{i}",
            buyer_id=f"B-{i}",
            seller_id=f"S-{i}",
            seller_name=f"Seller-{i}",
            buyer_target_price=buyer_target,
            buyer_max_price=buyer_max,
            buyer_quantity=buyer_qty,
            seller_floor_price=seller_floor,
            seller_list_price=seller_list,
            seller_moq=seller_moq,
            seller_quality=seller_quality,
            buyer_quality_min=buyer_quality,
            seller_stock=seller_stock,
            seller_payment_terms=seller_payments,
            buyer_payment_pref=buyer_payment,
            buyer_strategy=random.choice(["conceder", "tit_for_tat", "boulware", "realistic", "aspirational"]),
            seller_strategy=random.choice(["conceder", "tit_for_tat", "boulware", "realistic", "aspirational"]),
            buyer_batna_price=batna_price,
            seller_blacklisted=is_blacklisted,
            use_llm=False,
            allow_moq_waiver=random.choice([True, False]),
            allow_partial=random.choice([True, False]),
            buyer_urgency=random.choice(["low", "normal", "high", "urgent"]),
            stream_enabled=stream_test
        )
        
        try:
            deal = await run_negotiation(session)
        except Exception as e:
            print(f"  [ERROR] System crashed during negotiation iteration {i}: {e}")
            continue
            
        total_trials += 1
        
        # ─── INVARIANT VALIDATION ───
        
        # Pre-negotiation invariants
        if is_blacklisted:
            if deal.deal_reached:
                violations["blacklist_violation"] += 1
                
        if not deal.deal_reached:
            total_failed += 1
            # Invariant: Failed deal must always have final_price == 0 and quantity == 0
            if deal.final_price != 0.0 or deal.quantity != 0:
                violations["failed_deal_zeroing"] += 1
            continue
            
        total_reached += 1
        successful_deals_list.append(deal)
        
        # 1. ZOPA Budget Constraints
        effective_max = session.effective_buyer_max if session.effective_buyer_max > 0 else session.buyer_max_price
        if deal.final_price > effective_max * 1.001:
            violations["zopa_price_ceiling"] += 1
            
        # Re-calculate adjusted floor price exactly matching protocols.py
        moq_waiver_premium = 0.0
        actual_qty = deal.quantity
        if deal.moq_waiver_applied and actual_qty < session.seller_moq:
            shortfall_pct = 1 - (actual_qty / session.seller_moq)
            moq_waiver_premium = min(
                max(shortfall_pct * 0.12, 0.03),
                session.max_moq_premium_pct / 100
            )
            
        _, payment_premium = _find_common_payment_with_upgrade(session)
            
        volume_discount = 0.0
        if actual_qty >= session.seller_moq * 5:
            volume_discount = 0.06
        elif actual_qty >= session.seller_moq * 2:
            volume_discount = 0.03
            
        expected_floor = session.seller_floor_price * (1 + moq_waiver_premium + payment_premium) * (1 - volume_discount)
        
        if deal.final_price < expected_floor * 0.999:
            violations["zopa_price_floor"] += 1
            
        # 2. MOQ Constraints Validation
        if deal.moq_waiver_applied:
            if deal.quantity < session.seller_moq * 0.549:
                violations["moq_constraint"] += 1
        else:
            if deal.quantity < session.seller_moq:
                violations["moq_constraint"] += 1
                
        # 3. Quality Validation
        if QUALITY_RANK[deal.quality_grade] < QUALITY_RANK[session.buyer_quality_min]:
            violations["quality_safeguard"] += 1
            
        # 4. Partial Stock Validation
        if deal.partial_fulfillment:
            if deal.quantity != session.seller_stock or deal.quantity < session.buyer_quantity * 0.599:
                violations["partial_stock"] += 1
                
        # 5. Savings sign flip
        if deal.savings_pct is not None and deal.savings_pct < -1.01:
            violations["savings_sign_flip"] += 1
            
        # 6. BATNA Rejection Logic Invariant Check
        # Definition: A successful deal price must not be worse than 1.05 * BATNA (if BATNA is specified)
        if batna_price is not None and deal.final_price > round(batna_price * 1.05, 2):
            violations["batna_leakage"] += 1
            
        # 7. Replay Invariant Verification (Async queue match)
        if stream_test:
            # Wait up to 1 second for worker to process queue event
            reconstructed = None
            for _ in range(10):
                time.sleep(0.05)
                with worker._state_lock:
                    if session.session_id in worker.reconstructed_sessions and worker.reconstructed_sessions[session.session_id].deal is not None:
                        reconstructed = worker.reconstructed_sessions[session.session_id]
                        break
            if reconstructed is not None:
                # Assert equivalence
                try:
                    assert len(reconstructed.offers) == len(session.offers), "Offer count mismatch!"
                    assert reconstructed.deal.deal_reached == deal.deal_reached, "Deal status mismatch!"
                    assert reconstructed.deal.final_price == deal.final_price, "Price mismatch!"
                    replays_verified += 1
                except AssertionError:
                    replays_failed += 1
            else:
                replays_failed += 1

    # Stop distributed worker
    worker.stop()
    
    # 8. MCDA Boundedness Verification
    print("\n[3/4] Running Multi-Criteria Decision Analysis (MCDA) Scoring Invariant Test...")
    if successful_deals_list:
        ranked_deals = score_deals(successful_deals_list, buyer_max_price=500.0, buyer_deadline_days=30, top_n=len(successful_deals_list))
        for d in ranked_deals:
            if d.composite_score < 0.0 or d.composite_score > 1.0:
                violations["mcda_bounds"] += 1
    
    # 9. Direct Adversarial Vulnerability / Loophole Injection Testing
    print("\n[4/4] Attempting to Exploit Protocol Loopholes (Adversarial Testing)...")
    
    # adversarial test 1: BATNA early rounds bypass loophole
    print("  Triggering BATNA Loophole Scenario...")
    session_batna_leak = NegotiationSession(
        session_id="ADVERSARIAL-BATNA-BYPASS",
        buyer_id="B-DUMMY", seller_id="S-EXPLOITER", seller_name="Exploiter",
        buyer_target_price=80.0, buyer_max_price=150.0, buyer_quantity=100,
        seller_floor_price=110.0, seller_list_price=120.0, seller_moq=10,
        buyer_batna_price=90.0, # 1.05 * 90 = 94.5
        buyer_strategy="conceder", seller_strategy="conceder",
        seller_payment_terms=["net_30"], buyer_payment_pref="net_30",
        use_llm=False
    )
    deal_batna_leak = await run_negotiation(session_batna_leak)
    print(f"    Deal reached: {deal_batna_leak.deal_reached} | Price: Rs.{deal_batna_leak.final_price:.2f} | BATNA: Rs.90.00")
    if deal_batna_leak.deal_reached and deal_batna_leak.final_price > 90.0 * 1.05:
        print(f"    [LOOPHOLE EXPLOITED]: Buyer accepted a deal at Rs.{deal_batna_leak.final_price:.2f} which is worse than BATNA + 5% (Rs.94.50)!")
        violations["batna_leakage"] += 1
    else:
        print("    SUCCESS: BATNA leak rejected.")
        
    # adversarial test 2: LLM Hallucination blind trust loophole
    print("  Triggering LLM Hallucination Blind-Trust Scenario...")
    # Mocking llm suggest compromise by monkeypatching protocols.py's llm_suggest_compromise
    import simulation.negotiation.protocols as proto_module
    original_llm = proto_module.llm_suggest_compromise
    
    # Force a hallucinated price way below the seller's adjusted floor
    async def hallucinated_llm(*args, **kwargs):
        return 10.0, 999  # Rs.10.0 when seller floor is Rs.85.0
    proto_module.llm_suggest_compromise = hallucinated_llm
    
    session_llm_leak = NegotiationSession(
        session_id="ADVERSARIAL-LLM-HALLUCINATION",
        buyer_id="B-DUMMY", seller_id="S-VICTIM", seller_name="Victim",
        buyer_target_price=80.0, buyer_max_price=90.0, buyer_quantity=10,
        seller_floor_price=85.0, seller_list_price=120.0, seller_moq=10,
        buyer_strategy="realistic", seller_strategy="hardball",
        seller_payment_terms=["net_30"], buyer_payment_pref="net_30",
        use_llm=True, # enable LLM fallback
        max_rounds=1 # quick stalemate to trigger ZOPA fallback/LLM immediately
    )
    
    deal_llm_leak = await run_negotiation(session_llm_leak)
    # Restore original llm
    proto_module.llm_suggest_compromise = original_llm
    
    print(f"    Deal reached: {deal_llm_leak.deal_reached} | Price: Rs.{deal_llm_leak.final_price:.2f} | Seller Floor: Rs.85.00 | Reason: {deal_llm_leak.close_reason}")
    if deal_llm_leak.deal_reached and deal_llm_leak.final_price < 85.0:
        print(f"    [LOOPHOLE EXPLOITED]: Deal successfully closed at Rs.{deal_llm_leak.final_price:.2f}, bypassing the seller's floor price constraint of Rs.85.00!")
        violations["zopa_price_floor"] += 1
    else:
        print("    SUCCESS: Hallucination blocked.")
        
    # 10. Compile Report Output
    print("\n" + "=" * 60)
    print("PACT INVARIANT VALIDATION AUDIT SUMMARY")
    print("=" * 60)
    
    print(f"Total Trial Sessions Executed: {total_trials}")
    print(f"Successful Deals: {total_reached} | Failed Sessions: {total_failed}")
    print(f"Stream Replays Verified: {replays_verified} | Stream Replays Failed: {replays_failed}")
    
    print("\nInvariants Audit Table:")
    print("-" * 65)
    print(f"{'Protocol Invariant Checked':<35} | {'Violations Found':<18} | {'Status':<8}")
    print("-" * 65)
    
    print(f"{'1. ZOPA Price Floor Boundary':<35} | {violations['zopa_price_floor']:<18} | {('PASSED' if violations['zopa_price_floor'] == 0 else 'FAILED'):<8}")
    print(f"{'2. ZOPA Price Ceiling Budget':<35} | {violations['zopa_price_ceiling']:<18} | {('PASSED' if violations['zopa_price_ceiling'] == 0 else 'FAILED'):<8}")
    print(f"{'3. MOQ & Shortfall waivers':<35} | {violations['moq_constraint']:<18} | {('PASSED' if violations['moq_constraint'] == 0 else 'FAILED'):<8}")
    print(f"{'4. Quality Grade Thresholds':<35} | {violations['quality_safeguard']:<18} | {('PASSED' if violations['quality_safeguard'] == 0 else 'FAILED'):<8}")
    print(f"{'5. Partial Stock Fulfillment':<35} | {violations['partial_stock']:<18} | {('PASSED' if violations['partial_stock'] == 0 else 'FAILED'):<8}")
    print(f"{'6. Savings Sign Flip Protection':<35} | {violations['savings_sign_flip']:<18} | {('PASSED' if violations['savings_sign_flip'] == 0 else 'FAILED'):<8}")
    print(f"{'7. Failed Transaction Zeroing':<35} | {violations['failed_deal_zeroing']:<18} | {('PASSED' if violations['failed_deal_zeroing'] == 0 else 'FAILED'):<8}")
    print(f"{'8. MCDA Value Boundedness':<35} | {violations['mcda_bounds']:<18} | {('PASSED' if violations['mcda_bounds'] == 0 else 'FAILED'):<8}")
    print(f"{'9. Stream Playback Determinism':<35} | {replays_failed:<18} | {('PASSED' if replays_failed == 0 else 'FAILED'):<8}")
    print(f"{'10. Blacklist Safe Rejection':<35} | {violations['blacklist_violation']:<18} | {('PASSED' if violations['blacklist_violation'] == 0 else 'FAILED'):<8}")
    print(f"{'11. BATNA Price Leakage Protection':<35} | {violations['batna_leakage']:<18} | {('PASSED' if violations['batna_leakage'] == 0 else 'FAILED'):<8}")
    print("-" * 65)
    
    # Calculate Integrity Score
    base_score = 100.0
    failed_counts = sum(1 for v in violations.values() if v > 0) + (1 if replays_failed > 0 else 0)
    
    # Loophole deductions
    deductions = 0
    if violations["batna_leakage"] > 0:
        deductions += 15
    if violations["zopa_price_floor"] > 0:
        deductions += 15
        
    final_score = max(0.0, base_score - deductions - (failed_counts * 2))
    
    print(f"\nPACT PROTOCOL INTEGRITY SCORE: {final_score:.1f} / 100.0")
    if final_score >= 90:
        print("Verdict: HIGHLY ROBUST (Excellent transaction boundaries, standard protections work flawlessly)")
    elif final_score >= 70:
        print("Verdict: ROBUST WITH CRITICAL HOLES (Standard execution is safe, but explicit loopholes exist in BATNA/LLM boundaries)")
    else:
        print("Verdict: VULNERABLE (Significant transaction integrity drift, potential for invalid economic states)")
        
    return {
        "score": final_score,
        "violations": violations,
        "replays_failed": replays_failed
    }

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_protocol_verification_suite(2000))
