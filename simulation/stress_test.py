"""
10K-scale stress test for the A2A negotiation marketplace.
Runs N buyers × ~100 sellers/category = up to ~100K negotiations.
Tracks: MOQ waivers, volume discounts, partial fulfillment, LLM tokens, round distribution.
Reports saved to simulation/reports/latest.json and timestamped copy.

CLI: python3 simulation/stress_test.py [--buyers N] [--rounds N] [--no-llm] [--verbose]
     --buyers 10  → 100 buyers × ~100 sellers = ~10K negotiations (default)
     --buyers 100 → 1000 buyers × ~100 sellers = ~100K negotiations
"""
from __future__ import annotations

import argparse
import asyncio
import heapq
import json
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

_ROOT = Path(__file__).parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from simulation.agents.buyer_agent import BuyerAgent, BuyerRequirements
from simulation.agents.seller_agent import SellerAgent
from simulation.agents.sentinel_agent import SentinelAgent, get_sentinel
from simulation.negotiation.ranking import NegotiatedDeal

# ── Progress state (polled by api/routers/stats.py) ───────────────────────────
_progress_state: dict = {
    "running": False,
    "total": 0,
    "done": 0,
    "pct": 0.0,
    "started_at": None,
    "last_error": None,
}

# ── Mutex: prevent concurrent stress test runs ────────────────────────────────
_stress_running: bool = False


def _update_progress(done: int, total: int):
    _progress_state["done"] = done
    _progress_state["total"] = total
    _progress_state["pct"] = round(done / total * 100, 1) if total > 0 else 0.0


# ── Failure explanations ──────────────────────────────────────────────────────
FAILURE_EXPLANATIONS = {
    "moq_not_met": {
        "label": "MOQ Not Met",
        "desc": "Buyer quantity was too far below seller MOQ for a waiver.",
        "fix": "Enable order pooling; lower MOQ threshold for first-time buyers.",
        "severity": "medium",
    },
    "insufficient_stock": {
        "label": "Out of Stock",
        "desc": "Seller's available inventory was below buyer's needs even for partial.",
        "fix": "Add real-time stock sync; offer pre-order for established sellers.",
        "severity": "low",
    },
    "price_floor_above_buyer_max": {
        "label": "Price Too High",
        "desc": "Seller's floor price exceeds buyer's maximum budget — no ZOPA exists.",
        "fix": "Show buyers what budget unlocks more sellers; surface lower-grade alternatives.",
        "severity": "high",
    },
    "max_rounds_no_deal": {
        "label": "Negotiation Deadlock",
        "desc": "ZOPA existed but strategies failed to converge within the round budget.",
        "fix": "Enable LLM mediation for stuck sessions; use Realistic strategy for time-pressed categories.",
        "severity": "high",
    },
    "payment_term_mismatch": {
        "label": "Payment Term Mismatch",
        "desc": "No common payment term found even after upgrade negotiation.",
        "fix": "Add NBFC credit bridging for advance-only sellers; factoring for net-60 buyers.",
        "severity": "medium",
    },
    "quality_below_minimum": {
        "label": "Quality Grade Too Low",
        "desc": "Seller's quality grade was below buyer's minimum requirement.",
        "fix": "Show buyers relaxed-quality options with cost savings highlighted.",
        "severity": "low",
    },
    "seller_blacklisted": {
        "label": "Seller Blacklisted",
        "desc": "Buyer has blacklisted this seller due to past disputes.",
        "fix": "Build dispute resolution workflow to rehabilitate blacklisted sellers.",
        "severity": "low",
    },
    "negotiation_timeout": {
        "label": "Session Timeout",
        "desc": "Negotiation exceeded the time limit.",
        "fix": "Increase timeout for agricultural equipment and high-value categories.",
        "severity": "low",
    },
    "batna_rejected": {
        "label": "BATNA Walk-Away",
        "desc": "Buyer walked away — seller's counter was >5% worse than buyer's best known alternative.",
        "fix": "Surface better-matched sellers earlier; improve BATNA seeding with category benchmarks.",
        "severity": "medium",
    },
}


async def run_one_buyer(
    buyer: BuyerRequirements,
    sellers: list[SellerAgent],
    semaphore: asyncio.Semaphore,
    max_rounds: int,
    use_llm: bool,
    sentinel: SentinelAgent | None = None,
) -> tuple[list[NegotiatedDeal], list[NegotiatedDeal]]:
    async with semaphore:
        agent = BuyerAgent(buyer, top_n=10, use_llm=use_llm)
        agent.req.negotiation_rounds_budget = max_rounds
        top_deals, all_deals = await agent.negotiate_with_all(sellers, sentinel=sentinel)
        # Enrich deals with buyer/category metadata
        for d in all_deals:
            d.buyer_id = buyer.id
            d.category = buyer.required_category
        return top_deals, all_deals


async def run_stress_test(
    n_per_category: int = 10,
    max_concurrent: int = 50,
    max_rounds: int = 10,
    verbose: bool = False,
    seed: int = 42,
    use_llm: bool = True,
    infinite_stock: bool = False,
) -> dict:
    """
    Main stress test entry point.
    n_per_category=10  → 100 buyers × ~100 sellers/cat = ~10K negotiations
    n_per_category=100 → 1000 buyers × ~100 sellers/cat = ~100K negotiations
    infinite_stock=True → sets every seller's stock to 999,999 (no OOS failures)
    """
    global _stress_running
    if _stress_running:
        raise RuntimeError("A stress test is already running. Wait for it to complete.")
    _stress_running = True

    # Reset and initialize sentinel for this run
    sentinel = get_sentinel()
    sentinel.reset()

    _progress_state.update({
        "running": True,
        "started_at": datetime.now().isoformat(),
        "done": 0, "total": 0, "pct": 0.0, "last_error": None
    })

    data_dir = Path(__file__).parent / "data"
    reports_dir = Path(__file__).parent / "reports"
    reports_dir.mkdir(exist_ok=True)

    # ── Load or generate data ─────────────────────────────────────────────────
    sellers_path = data_dir / "mock_sellers.json"
    if not sellers_path.exists():
        if verbose:
            print("Generating new mock data (1000 sellers)...")
        from simulation.data.generate_mock_data import generate_sellers, generate_buyers
        import json as _json
        sellers_data = generate_sellers(100)
        buyers_data = generate_buyers(n_per_category)
        with open(sellers_path, "w", encoding="utf-8") as f:
            _json.dump(sellers_data, f)
        buyers_path = data_dir / "mock_buyers.json"
        with open(buyers_path, "w", encoding="utf-8") as f:
            _json.dump(buyers_data, f)
    else:
        with open(sellers_path, encoding="utf-8") as f:
            sellers_data = json.load(f)

    all_sellers = [SellerAgent.from_dict(s) for s in sellers_data]

    # ── Infinite stock mode: eliminate OOS failures ───────────────────────────
    if infinite_stock:
        for s in all_sellers:
            s.current_stock_units = 999_999
            s.max_order_qty = 999_999
        if verbose:
            print("Infinite stock mode ON - Out-of-Stock failures disabled", flush=True)

    # ── Generate stress buyers ────────────────────────────────────────────────
    from simulation.data.generate_mock_data import CATEGORIES, CATEGORY_CONFIG
    stress_buyers = _generate_stress_buyers(n_per_category, CATEGORIES, CATEGORY_CONFIG, seed)

    # Estimate total negotiations
    _cat_count: dict[str, int] = Counter(s.category for s in all_sellers)
    total_est = sum(_cat_count.get(b.required_category, 100) for b in stress_buyers)
    _update_progress(0, total_est)

    if verbose:
        print(f"Stress test: {len(stress_buyers)} buyers x {len(all_sellers)} sellers", flush=True)
        print(f"Estimated ~{total_est} negotiation pairs | LLM={'ON' if use_llm else 'OFF'}", flush=True)

    # ── Run negotiations ──────────────────────────────────────────────────────
    t0 = time.monotonic()
    semaphore = asyncio.Semaphore(max_concurrent)
    done_negs = 0

    # Checkpoint counters (live display only)
    _run_success = 0
    _run_failed = 0
    _run_savings_sum = 0.0
    _run_failure_ctr: Counter = Counter()
    _last_checkpoint = -1   # last reported 10% bucket

    # ── Streaming aggregators (O(1) per deal — no list accumulation) ──────────
    total_success = 0
    total_failed_count = 0
    deal_value_sum = 0.0
    savings_sum_agg = 0.0
    vs_list_sum_agg = 0.0
    rounds_sum_agg = 0.0
    total_llm_tokens = 0
    moq_waiver_count = 0
    volume_discount_count = 0
    partial_count = 0
    llm_mediated = 0
    batna_rejections = 0
    delivery_trades = 0
    payment_trades = 0
    injection_blocks = 0
    round_dist: Counter = Counter()
    savings_hist: Counter = Counter()
    failure_counts: Counter = Counter()
    by_cat: dict = {
        cat: {"total": 0, "success": 0, "failed": 0,
              "savings_sum": 0.0, "vs_list_sum": 0.0, "rounds_sum": 0.0,
              "moq_waivers": 0, "llm_tokens": 0}
        for cat in CATEGORIES
    }
    by_strat: dict = defaultdict(lambda: {"total": 0, "success": 0, "savings_sum": 0.0})
    seller_stats_agg: dict = defaultdict(lambda: {
        "queried": 0, "closed": 0, "total_savings": 0.0,
        "strategy": "", "category": "", "name": "", "failure_reasons": Counter(),
    })
    failure_samples: dict = defaultdict(list)   # max 5 samples per reason
    close_misses: list = []                      # max 50 close-miss records
    top_deals_heap: list = []                    # min-heap, top 30 by composite_score
    _heap_counter = 0                            # tiebreaker for equal scores

    # Pre-group sellers by category once (O(m)) instead of O(n*m) per-buyer scan
    sellers_by_cat: dict[str, list] = defaultdict(list)
    for s in all_sellers:
        sellers_by_cat[s.category].append(s)

    # Trackers for thread-safe progress updating
    progress_tracker = [0]
    last_update = [0]

    async def run_one_buyer_with_progress(buyer, sellers_for_buyer):
        res_top, res_all = await run_one_buyer(buyer, sellers_for_buyer, semaphore, max_rounds, use_llm, sentinel=sentinel)
        num_negs = len(res_all)
        progress_tracker[0] += num_negs
        # Throttle progress updates to avoid event loop bloat
        if progress_tracker[0] - last_update[0] >= 500 or progress_tracker[0] == total_est:
            last_update[0] = progress_tracker[0]
            _update_progress(progress_tracker[0], total_est)
            if verbose:
                rate = progress_tracker[0] / max(time.monotonic() - t0, 0.001)
                print(f"  [Progress] {progress_tracker[0]:,} / {total_est:,} ({progress_tracker[0]/total_est*100:.1f}%) | {rate:,.0f} negs/s", flush=True)
        return res_top, res_all

    chunk_results = []
    chunk_size = 100
    for i in range(0, len(stress_buyers), chunk_size):
        batch = stress_buyers[i : i + chunk_size]
        batch_tasks = []
        for buyer in batch:
            sellers_for_buyer = sellers_by_cat[buyer.required_category]
            batch_tasks.append(run_one_buyer_with_progress(buyer, sellers_for_buyer))
        
        batch_results = await asyncio.gather(*batch_tasks)
        chunk_results.extend(batch_results)
        
        # Non-blocking pause to simulate a realistic rolling execution over 12-15s
        await asyncio.sleep(0.35)

    for (_, chunk_deals) in chunk_results:
        done_negs += len(chunk_deals)
        for d in chunk_deals:
            cat = d.category or ""
            strat = d.seller_strategy or "unknown"

            # Seller leaderboard (every deal)
            ss = seller_stats_agg[d.seller_id]
            ss["name"] = d.seller_name
            ss["category"] = cat
            ss["strategy"] = strat
            ss["queried"] += 1

            # Cross-deal counters
            if getattr(d, "batna_used", False):
                batna_rejections += 1
            injection_blocks += getattr(d, "injection_blocked", 0) or 0
            total_llm_tokens += d.llm_tokens_used or 0

            # Per-category total + LLM tokens
            if cat in by_cat:
                by_cat[cat]["total"] += 1
                by_cat[cat]["llm_tokens"] += d.llm_tokens_used or 0

            # Per-strategy total
            by_strat[strat]["total"] += 1

            if not d.deal_reached:
                total_failed_count += 1
                _run_failed += 1
                failure_counts[d.failure_reason] += 1
                _run_failure_ctr[d.failure_reason] += 1
                ss["failure_reasons"][d.failure_reason] += 1

                if cat in by_cat:
                    by_cat[cat]["failed"] += 1

                # Failure sample (cap 5 per reason)
                if len(failure_samples[d.failure_reason]) < 5:
                    failure_samples[d.failure_reason].append({
                        "seller": d.seller_name, "category": cat,
                        "price_gap_pct": round(d.price_gap_pct, 1),
                        "strategy": strat,
                    })

                # Close miss (cap 50 total)
                if (len(close_misses) < 50
                        and d.failure_reason == "max_rounds_no_deal"
                        and d.price_gap_pct > 0):
                    close_misses.append({
                        "seller_id": d.seller_id, "seller_name": d.seller_name,
                        "buyer_id": d.buyer_id, "category": cat,
                        "seller_strategy": strat,
                        "price_gap_pct": d.price_gap_pct,
                        "rounds": d.negotiation_rounds,
                        "fix": "Enable LLM mediation or increase round budget",
                    })
            else:
                total_success += 1
                _run_success += 1
                _run_savings_sum += d.savings_pct or 0.0

                deal_value_sum += (d.final_price or 0.0) * (d.quantity or 0)
                savings_sum_agg += d.savings_pct or 0.0
                vs_list_sum_agg += d.vs_list_pct or 0.0
                rounds_sum_agg += d.negotiation_rounds or 0
                if d.moq_waiver_applied:
                    moq_waiver_count += 1
                if (d.volume_discount_applied or 0) > 0:
                    volume_discount_count += 1
                if d.partial_fulfillment:
                    partial_count += 1
                if (d.llm_tokens_used or 0) > 0:
                    llm_mediated += 1
                trade = getattr(d, "multi_dim_trade", "")
                if trade == "delivery_trade":
                    delivery_trades += 1
                elif trade == "payment_trade":
                    payment_trades += 1

                ss["closed"] += 1
                ss["total_savings"] += d.savings_pct or 0.0

                # Round distribution
                round_dist[str(d.negotiation_rounds)] += 1

                # Savings histogram (5% buckets)
                bucket = max(0, int((d.savings_pct or 0.0) // 5)) * 5
                savings_hist[f"{bucket}"] += 1

                # Per-category success stats
                if cat in by_cat:
                    by_cat[cat]["success"] += 1
                    by_cat[cat]["savings_sum"] += d.savings_pct or 0.0
                    by_cat[cat]["vs_list_sum"] += d.vs_list_pct or 0.0
                    by_cat[cat]["rounds_sum"] += d.negotiation_rounds or 0
                    if d.moq_waiver_applied:
                        by_cat[cat]["moq_waivers"] += 1

                # Per-strategy success
                by_strat[strat]["success"] += 1
                by_strat[strat]["savings_sum"] += d.savings_pct or 0.0

                # Top-30 deals min-heap by composite_score
                score = d.composite_score or 0.0
                deal_dict = {
                    "seller_id": d.seller_id, "seller_name": d.seller_name,
                    "buyer_id": d.buyer_id, "category": cat,
                    "final_price": d.final_price, "quantity": d.quantity,
                    "quality_grade": d.quality_grade, "delivery_days": d.delivery_days,
                    "payment_term": d.payment_term, "rounds": d.negotiation_rounds,
                    "savings_pct": d.savings_pct, "vs_list_pct": d.vs_list_pct,
                    "composite_score": score, "narrative": d.narrative,
                    "moq_waiver": d.moq_waiver_applied,
                    "volume_discount": d.volume_discount_applied,
                    "partial_fulfillment": d.partial_fulfillment,
                    "llm_tokens": d.llm_tokens_used,
                    "offer_trajectory": d.offer_trajectory,
                    "close_reason": getattr(d, "close_reason", ""),
                }
                _heap_counter += 1
                entry = (score, _heap_counter, deal_dict)
                if len(top_deals_heap) < 30:
                    heapq.heappush(top_deals_heap, entry)
                elif score > top_deals_heap[0][0]:
                    heapq.heapreplace(top_deals_heap, entry)

    elapsed = time.monotonic() - t0
    total_neg = done_negs
    total_failed = total_failed_count

    # ── Finalise aggregated stats ─────────────────────────────────────────────
    platform_fee = deal_value_sum * 0.01
    avg_savings = savings_sum_agg / max(total_success, 1)
    avg_vs_list = vs_list_sum_agg / max(total_success, 1)
    avg_rounds = rounds_sum_agg / max(total_success, 1)
    sentinel_summary = sentinel.get_summary()

    # By-category: convert running sums to averages
    by_cat_report: dict[str, dict] = {}
    for cat, v in by_cat.items():
        n_ok = v["success"]
        n_all = v["total"]
        by_cat_report[cat] = {
            "total": n_all,
            "success": n_ok,
            "failed": v["failed"],
            "success_pct": round(n_ok / n_all * 100, 1) if n_all else 0,
            "avg_savings_pct": round(v["savings_sum"] / n_ok, 2) if n_ok else 0,
            "avg_vs_list_pct": round(v["vs_list_sum"] / n_ok, 2) if n_ok else 0,
            "avg_rounds": round(v["rounds_sum"] / n_ok, 1) if n_ok else 0,
            "moq_waivers": v["moq_waivers"],
            "llm_tokens": v["llm_tokens"],
        }

    # By-strategy: convert sums to averages
    by_strat_report: dict[str, dict] = {}
    for strat, v in by_strat.items():
        n_ok = v["success"]
        n_all = v["total"]
        by_strat_report[strat] = {
            "total": n_all,
            "success": n_ok,
            "success_pct": round(n_ok / n_all * 100, 1) if n_all else 0,
            "avg_savings_pct": round(v["savings_sum"] / n_ok, 2) if n_ok else 0,
        }

    # Failure breakdown
    failure_breakdown = []
    for reason, count in failure_counts.most_common():
        exp = FAILURE_EXPLANATIONS.get(reason, {
            "label": reason.replace("_", " ").title(),
            "desc": "Negotiation failed.", "fix": "Investigate.", "severity": "medium",
        })
        failure_breakdown.append({
            "reason": reason, "label": exp["label"],
            "count": count,
            "pct": round(count / total_failed * 100, 1) if total_failed else 0,
            "desc": exp["desc"], "fix": exp["fix"], "severity": exp.get("severity", "medium"),
            "samples": failure_samples[reason],
        })

    # Agent leaderboard (sorted by success_pct desc)
    leaderboard = []
    for sid, s in seller_stats_agg.items():
        leaderboard.append({
            "seller_id": sid, "name": s["name"],
            "strategy": s["strategy"], "category": s["category"],
            "queried": s["queried"], "closed": s["closed"],
            "success_pct": round(s["closed"] / s["queried"] * 100, 1) if s["queried"] else 0,
            "avg_savings_pct": round(s["total_savings"] / s["closed"], 1) if s["closed"] else 0,
            "top_failure": s["failure_reasons"].most_common(1)[0][0] if s["failure_reasons"] else "",
        })
    leaderboard.sort(key=lambda x: x["success_pct"], reverse=True)

    # Top deals — drain heap sorted by score desc
    top_deals_report = [
        dd for _, _tc, dd in sorted(top_deals_heap, key=lambda x: -x[0])
    ]

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    report = {
        "meta": {
            "timestamp": ts,
            "duration_secs": round(elapsed, 3),
            "engine": "SAO + Ollama LLM Hook" if use_llm else "Pure SAO Rule-Based",
            "llm_model": "qwen2.5-coder:7b" if use_llm else "disabled",
            "seed": seed,
            "buyers_per_category": n_per_category,
            "max_rounds": max_rounds,
        },
        "summary": {
            "total_negotiations": total_neg,
            "deals_closed": total_success,
            "deals_failed": total_failed,
            "success_rate_pct": round(total_success / total_neg * 100, 1) if total_neg else 0,
            "total_deal_value_inr": round(deal_value_sum, 0),
            "platform_fee_inr": round(platform_fee, 0),
            "avg_buyer_savings_pct": round(avg_savings, 2),
            "avg_vs_list_pct": round(avg_vs_list, 2),
            "avg_rounds_per_deal": round(avg_rounds, 1),
            "total_llm_tokens": total_llm_tokens,
            "moq_waivers_granted": moq_waiver_count,
            "volume_discounts_applied": volume_discount_count,
            "partial_fulfillment_deals": partial_count,
            "llm_assisted_deals": llm_mediated,
            "batna_rejections": batna_rejections,
            "delivery_trades": delivery_trades,
            "payment_trades": payment_trades,
            "injection_blocks_total": injection_blocks,
            "sentinel_critical_alerts": sentinel_summary.get("critical", 0),
        },
        "sentinel": sentinel_summary,
        "round_distribution": dict(sorted(round_dist.items(), key=lambda x: int(x[0]))),
        "savings_histogram": dict(sorted(savings_hist.items(), key=lambda x: int(x[0]))),
        "by_failure_reason": failure_breakdown,
        "by_category": by_cat_report,
        "by_strategy": by_strat_report,
        "moq_analysis": {
            "total_moq_failures": failure_counts.get("moq_not_met", 0),
            "moq_waivers_granted": moq_waiver_count,
            "partial_fulfillment_deals": partial_count,
        },
        "llm_usage": {
            "total_tokens": total_llm_tokens,
            "llm_assisted_deals": llm_mediated,
            "pct_sessions_with_llm": round(llm_mediated / max(total_neg, 1) * 100, 1),
        },
        "agent_leaderboard": leaderboard,
        "top_deals": top_deals_report,
        "close_misses": close_misses,
        "findings": _build_findings(
            total_success, total_failed, failure_counts, by_cat_report, by_strat_report,
            total_neg, elapsed, infinite_stock, batna_rejections, delivery_trades,
        ),
    }

    report_path = reports_dir / f"stress_{ts}.json"
    latest_path = reports_dir / "latest.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    _stress_running = False
    _progress_state["running"] = False
    _update_progress(total_neg, total_neg)

    if verbose:
        s = report["summary"]
        print(f"\n{'='*60}", flush=True)
        print(f"DONE in {elapsed:.2f}s | {s['total_negotiations']} negotiations | "
              f"{s['deals_closed']} deals ({s['success_rate_pct']}%)", flush=True)
        print(f"Deal value: Rs.{s['total_deal_value_inr']:,.0f} | "
              f"Avg savings: {s['avg_buyer_savings_pct']:.1f}% vs budget | "
              f"{s['avg_vs_list_pct']:.1f}% vs list", flush=True)
        print(f"Rounds avg: {s['avg_rounds_per_deal']:.1f} | "
              f"LLM tokens: {s['total_llm_tokens']} | "
              f"LLM deals: {s['llm_assisted_deals']}", flush=True)
        print(f"MOQ waivers: {s['moq_waivers_granted']} | "
              f"Partial fills: {s['partial_fulfillment_deals']}", flush=True)
        print(f"Report: {latest_path}", flush=True)

    return report


def _build_findings(
    n_success: int, n_failed: int, failure_counts, by_cat, by_strat,
    total_neg, elapsed, infinite_stock, batna_rejections, delivery_trades,
) -> dict:
    """Auto-summarise where the market breaks down and what performs best."""
    total_deals = n_success
    total_failed = n_failed
    success_rate = total_deals / max(total_neg, 1) * 100
    throughput = total_neg / max(elapsed, 0.001)

    # Dominant failure reason
    top_failure = failure_counts.most_common(1)
    dominant_fail = top_failure[0][0] if top_failure else "none"
    dominant_fail_pct = top_failure[0][1] / max(total_failed, 1) * 100 if top_failure else 0

    # Structural failure rate (excluding OOS which is a data issue)
    structural_failed = sum(
        c for r, c in failure_counts.items() if r != "insufficient_stock"
    )
    structural_fail_pct = structural_failed / max(total_neg, 1) * 100

    # Best and worst categories
    cat_sorted = sorted(
        [(cat, v["success_pct"]) for cat, v in by_cat.items() if v["total"] > 0],
        key=lambda x: x[1]
    )
    best_cat = cat_sorted[-1] if cat_sorted else ("?", 0)
    worst_cat = cat_sorted[0] if cat_sorted else ("?", 0)

    # Best strategy for buyers (most savings)
    strat_sorted = sorted(
        [(s, v["avg_savings_pct"]) for s, v in by_strat.items() if v["total"] > 0],
        key=lambda x: x[1]
    )
    best_strat_savings = strat_sorted[-1] if strat_sorted else ("?", 0)

    # Ceiling hit: negotiations that reached max rounds without a deal
    ceiling_hit = failure_counts.get("max_rounds_no_deal", 0)
    ceiling_pct = ceiling_hit / max(total_neg, 1) * 100

    # BATNA walk-away rate
    batna_pct = batna_rejections / max(total_neg, 1) * 100

    # Price mismatch (no ZOPA)
    price_mismatch = failure_counts.get("price_floor_above_buyer_max", 0)
    price_mismatch_pct = price_mismatch / max(total_neg, 1) * 100

    # What if OOS were fixed? (counterfactual)
    oos_count = failure_counts.get("insufficient_stock", 0)
    counterfactual_success_rate = (total_deals + oos_count) / max(total_neg, 1) * 100

    bottlenecks = []
    if dominant_fail_pct > 50:
        label = FAILURE_EXPLANATIONS.get(dominant_fail, {}).get("label", dominant_fail)
        bottlenecks.append(f"{label} dominates at {dominant_fail_pct:.0f}% of failures")
    if batna_pct > 3:
        bottlenecks.append(f"BATNA walk-aways {batna_pct:.1f}% — market prices misaligned")
    if price_mismatch_pct > 2:
        bottlenecks.append(f"Price-too-high {price_mismatch_pct:.1f}% — buyer budgets too tight")
    if ceiling_pct > 1:
        bottlenecks.append(f"Round-ceiling hit {ceiling_pct:.1f}% — enable LLM mediation")
    if not bottlenecks:
        bottlenecks.append("No structural bottlenecks detected — negotiation engine is healthy")

    return {
        "throughput_negs_per_sec": round(throughput, 0),
        "success_rate_pct": round(success_rate, 1),
        "structural_failure_pct": round(structural_fail_pct, 1),
        "counterfactual_success_if_oos_fixed_pct": round(counterfactual_success_rate, 1),
        "dominant_failure": dominant_fail,
        "dominant_failure_pct": round(dominant_fail_pct, 1),
        "best_category": {"name": best_cat[0], "success_pct": round(best_cat[1], 1)},
        "worst_category": {"name": worst_cat[0], "success_pct": round(worst_cat[1], 1)},
        "best_strategy_for_savings": {"strategy": best_strat_savings[0], "avg_savings_pct": round(best_strat_savings[1], 1)},
        "batna_walkaway_pct": round(batna_pct, 1),
        "price_mismatch_pct": round(price_mismatch_pct, 1),
        "round_ceiling_hit_pct": round(ceiling_pct, 1),
        "delivery_trades": delivery_trades,
        "infinite_stock_mode": infinite_stock,
        "bottlenecks": bottlenecks,
    }


def _generate_stress_buyers(n_per_category, categories, category_config, seed):
    import random as rnd
    rnd.seed(seed)
    strategies = ["conceder", "tit_for_tat", "boulware", "realistic", "aspirational"]
    sw = [25, 30, 20, 15, 10]
    urgencies = ["low", "normal", "high", "urgent"]
    uw = [15, 50, 25, 10]
    buyers = []
    idx = 1
    for cat in categories:
        cfg = category_config[cat]
        fl, fh = cfg["floor_range"]
        ml, mh = cfg["markup"]
        avg_list = (fl + fh) / 2 * (ml + mh) / 2
        ql, qh = cfg["buyer_qty_range"]
        for _ in range(n_per_category):
            profile = rnd.choice(["budget_hunter", "value_seeker", "quality_premium", "urgent_buyer"])
            if profile == "budget_hunter":
                tp, mp = avg_list * rnd.uniform(0.65, 0.78), avg_list * rnd.uniform(0.85, 0.95)
            elif profile == "value_seeker":
                tp, mp = avg_list * rnd.uniform(0.75, 0.85), avg_list * rnd.uniform(0.92, 1.05)
            elif profile == "quality_premium":
                tp, mp = avg_list * rnd.uniform(0.80, 0.92), avg_list * rnd.uniform(1.00, 1.20)
            else:
                tp, mp = avg_list * rnd.uniform(0.85, 1.00), avg_list * rnd.uniform(1.05, 1.25)
            if tp >= mp:
                tp = mp * 0.87
            qty = int(rnd.uniform(ql, qh))
            if qty > 1000:
                qty = round(qty / 100) * 100
            elif qty > 100:
                qty = round(qty / 25) * 25
            elif qty > 10:
                qty = round(qty / 5) * 5
            buyers.append(BuyerRequirements(
                id=f"SB{idx:05d}",
                name=f"Buyer-{cat[:6]}-{idx}",
                location_state="Maharashtra",
                required_category=cat,
                quantity_units=qty,
                target_price_per_unit=round(tp, 2),
                max_price_per_unit=round(mp, 2),
                quality_min=rnd.choices(["A", "B", "C"], weights=[15, 60, 25], k=1)[0],
                delivery_deadline_days=rnd.choice([14, 21, 30, 45, 60]),
                payment_preference=rnd.choice(cfg["payment_pref"]),
                negotiation_rounds_budget=10,
                negotiation_strategy=rnd.choices(strategies, weights=sw, k=1)[0],
                urgency_level=rnd.choices(urgencies, weights=uw, k=1)[0],
                allow_moq_waiver=True,
                allow_partial_fulfillment=True,
                max_moq_premium_pct=round(rnd.uniform(3.0, 10.0), 1),
            ))
            idx += 1
    return buyers


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="A2A Marketplace Stress Test")
    parser.add_argument("--buyers", type=int, default=10,
                        help="Buyers per category (10=~10K, 100=~100K)")
    parser.add_argument("--rounds", type=int, default=10)
    parser.add_argument("--no-llm", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--infinite-stock", action="store_true",
                        help="Set all seller stock to 999,999 — eliminates Out-of-Stock failures")
    args = parser.parse_args()

    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    report = asyncio.run(run_stress_test(
        n_per_category=args.buyers,
        max_rounds=args.rounds,
        verbose=args.verbose,
        seed=args.seed,
        use_llm=not args.no_llm,
        infinite_stock=args.infinite_stock,
    ))
    s = report["summary"]
    print(f"Done: {s['total_negotiations']} negotiations | {s['deals_closed']} deals "
          f"({s['success_rate_pct']}%) | Rs.{s['total_deal_value_inr']:,.0f} value | "
          f"{s['total_llm_tokens']} LLM tokens")
