"""
Automotive B2B Negotiation Stress Test — Indian Auto-Ancillary Sector.
10 categories × N buyers × 100 sellers/category.

Reflects real Indian automotive supply chain:
  Pune (engine/transmission), Chennai (brakes/electrical), Gurgaon (suspension/steering),
  Gujarat (exhaust/cooling), Maharashtra (body panels), Karnataka (fuel systems).

CLI:
  py simulation/automotive_stress_test.py --buyers 1600 --no-llm --infinite-stock --verbose
  py simulation/automotive_stress_test.py --buyers 50  --no-llm --verbose          # quick demo
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

# ── Failure explanations (automotive-specific additions) ──────────────────────

FAILURE_EXPLANATIONS = {
    "moq_not_met": {
        "label": "MOQ Not Met",
        "desc": "Buyer quantity was too far below seller MOQ for a waiver.",
        "fix": "Enable order pooling across OEM Tier-1 lines; first-lot MOQ waivers for new accounts.",
        "severity": "medium",
    },
    "insufficient_stock": {
        "label": "Out of Stock",
        "desc": "Seller's available inventory was below buyer's needs even for partial.",
        "fix": "Real-time ERP/Tally stock sync; pre-order flag for high-demand SKUs.",
        "severity": "low",
    },
    "price_floor_above_buyer_max": {
        "label": "Price Too High",
        "desc": "Seller's floor price exceeds buyer's maximum budget — no ZOPA exists.",
        "fix": "Show Grade-B alternatives for aftermarket buyers; surface cost breakdown.",
        "severity": "high",
    },
    "max_rounds_no_deal": {
        "label": "Negotiation Deadlock",
        "desc": "ZOPA existed but strategies failed to converge within round budget.",
        "fix": "Enable LLM mediation for hardball/boulware standoffs; widen round budget for high-value parts.",
        "severity": "high",
    },
    "payment_term_mismatch": {
        "label": "Payment Term Mismatch",
        "desc": "No common payment term found even after upgrade negotiation.",
        "fix": "NBFC trade-credit for advance-only engine/electrical suppliers; factoring for net-60 OEMs.",
        "severity": "medium",
    },
    "quality_below_minimum": {
        "label": "Quality Grade Too Low",
        "desc": "Seller's quality grade was below buyer's minimum (IATF16949 etc).",
        "fix": "Surface Grade-B options with cost savings for aftermarket/fleet buyers; certification filter.",
        "severity": "low",
    },
    "seller_blacklisted": {
        "label": "Seller Blacklisted",
        "desc": "Buyer has blacklisted this seller due to past disputes.",
        "fix": "Build MSME dispute resolution; 90-day probation rehab with escrow.",
        "severity": "low",
    },
    "negotiation_timeout": {
        "label": "Session Timeout",
        "desc": "Negotiation exceeded time limit.",
        "fix": "Increase timeout for IATF16949-certified parts (higher complexity).",
        "severity": "low",
    },
    "batna_rejected": {
        "label": "BATNA Walk-Away",
        "desc": "Buyer walked away — counter was >5% worse than their best known alternative.",
        "fix": "Improve BATNA seeding with real-time category price benchmarks.",
        "severity": "medium",
    },
}

# ── Automotive buyer profiles ─────────────────────────────────────────────────

AUTOMOTIVE_BUYER_PROFILES = {
    "oem_tier1": {
        "tp_mult": (0.72, 0.82), "mp_mult": (0.88, 0.98),
        "quality": "A", "w": 25,
        "desc": "OEM Tier-1 — IATF certified, tight specs, advance-50 payment",
    },
    "tier2_assembler": {
        "tp_mult": (0.78, 0.88), "mp_mult": (0.95, 1.08),
        "quality": "B", "w": 35,
        "desc": "Tier-2 Assembler — net-30/60, moderate quality, high volume",
    },
    "aftermarket": {
        "tp_mult": (0.65, 0.76), "mp_mult": (0.82, 0.95),
        "quality": "B", "w": 25,
        "desc": "Aftermarket Distributor — price-sensitive, Grade-B ok, cash-preferred",
    },
    "fleet_buyer": {
        "tp_mult": (0.85, 0.96), "mp_mult": (1.02, 1.18),
        "quality": "A", "w": 15,
        "desc": "Fleet Buyer — Grade-A quality, willing to pay premium, urgent delivery",
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
        for d in all_deals:
            d.buyer_id = buyer.id
            d.category = buyer.required_category
        return top_deals, all_deals


async def run_automotive_stress_test(
    n_per_category: int = 1600,
    max_concurrent: int = 50,
    max_rounds: int = 10,
    verbose: bool = False,
    seed: int = 42,
    use_llm: bool = False,
    infinite_stock: bool = True,
    time_limit_secs: float = 30.0,
) -> dict:
    """
    Run automotive SAO stress test.
    n_per_category=1600 → 16,000 buyers × 100 sellers/cat ≈ 1.6M negotiations (30s target).
    time_limit_secs: if > 0, stop dispatching new buyers after this many seconds elapsed.
    """
    import simulation.stress_test
    if simulation.stress_test._stress_running:
        raise RuntimeError("A stress test is already running. Wait for it to complete.")
    simulation.stress_test._stress_running = True

    simulation.stress_test._progress_state.update({
        "running": True,
        "started_at": datetime.now().isoformat(),
        "done": 0, "total": 0, "pct": 0.0, "last_error": None
    })

    from simulation.data.generate_automotive_data import (
        AUTOMOTIVE_CATEGORIES, AUTOMOTIVE_CATEGORY_CONFIG,
    )

    sentinel = get_sentinel()
    sentinel.reset()

    data_dir = Path(__file__).parent / "data"
    reports_dir = Path(__file__).parent / "reports"
    reports_dir.mkdir(exist_ok=True)

    # ── Load or generate automotive sellers ───────────────────────────────────
    sellers_path = data_dir / "automotive_sellers.json"
    if not sellers_path.exists():
        if verbose:
            print("automotive_sellers.json not found — generating now...", flush=True)
        from simulation.data.generate_automotive_data import generate_automotive_sellers
        sellers_data = generate_automotive_sellers(100)
        with open(sellers_path, "w", encoding="utf-8") as f:
            json.dump(sellers_data, f, indent=2, ensure_ascii=False)
        print(f"  Generated {len(sellers_data)} automotive sellers -> {sellers_path}", flush=True)
    else:
        with open(sellers_path, encoding="utf-8") as f:
            sellers_data = json.load(f)

    all_sellers = [SellerAgent.from_dict(s) for s in sellers_data]

    # ── Infinite stock mode ───────────────────────────────────────────────────
    if infinite_stock:
        for s in all_sellers:
            s.current_stock_units = 999_999
            s.max_order_qty = 999_999
        if verbose:
            print("Infinite stock mode ON - OOS failures disabled", flush=True)

    # ── Generate stress buyers ────────────────────────────────────────────────
    stress_buyers = _generate_automotive_stress_buyers(
        n_per_category, AUTOMOTIVE_CATEGORIES, AUTOMOTIVE_CATEGORY_CONFIG, seed
    )

    # ── Streaming aggregators (O(1) per deal) ─────────────────────────────────
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
    done_negs = 0

    by_cat: dict = {
        cat: {"total": 0, "success": 0, "failed": 0,
              "savings_sum": 0.0, "vs_list_sum": 0.0, "rounds_sum": 0.0,
              "moq_waivers": 0, "llm_tokens": 0}
        for cat in AUTOMOTIVE_CATEGORIES
    }
    by_strat: dict = defaultdict(lambda: {"total": 0, "success": 0, "savings_sum": 0.0})

    # Automotive-specific: track by buyer profile
    by_profile: dict = {
        profile: {"total": 0, "success": 0, "savings_sum": 0.0, "vs_list_sum": 0.0}
        for profile in AUTOMOTIVE_BUYER_PROFILES
    }

    seller_stats_agg: dict = defaultdict(lambda: {
        "queried": 0, "closed": 0, "total_savings": 0.0,
        "strategy": "", "category": "", "name": "", "failure_reasons": Counter(),
    })
    failure_samples: dict = defaultdict(list)
    close_misses: list = []
    top_deals_heap: list = []
    _heap_counter = 0

    # Pre-group sellers by category O(m)
    sellers_by_cat: dict[str, list] = defaultdict(list)
    for s in all_sellers:
        sellers_by_cat[s.category].append(s)

    # Checkpoint counters
    _run_success = 0
    _run_failed = 0
    _run_savings_sum = 0.0
    _run_failure_ctr: Counter = Counter()
    _last_checkpoint = -1

    t0 = time.monotonic()
    semaphore = asyncio.Semaphore(max_concurrent)

    total_est = sum(
        len(sellers_by_cat[b.required_category]) for b in stress_buyers
    )
    simulation.stress_test._update_progress(0, total_est)

    if verbose:
        print(
            f"\nAutomotive SAO Stress Test\n"
            f"  Sellers       : {len(all_sellers)} ({len(AUTOMOTIVE_CATEGORIES)} categories x 100)\n"
            f"  Buyers        : {len(stress_buyers)} ({n_per_category}/category)\n"
            f"  Est. negs     : {total_est:,}\n"
            f"  Time limit    : {time_limit_secs}s\n"
            f"  LLM           : {'ON' if use_llm else 'OFF'}\n"
            f"  Infinite stock: {'ON' if infinite_stock else 'OFF'}\n",
            flush=True
        )

    # Build profile lookup from buyer id (stored during buyer generation)
    buyer_profile_map: dict[str, str] = {b.id: getattr(b, "_profile", "tier2_assembler")
                                          for b in stress_buyers}

    # Trackers for thread-safe progress updating
    progress_tracker = [0]
    last_update = [0]
    buyers_dispatched = 0
    time_limit_hit = False

    async def run_one_buyer_with_progress(buyer, sellers_for_buyer):
        nonlocal buyers_dispatched, time_limit_hit
        # Time-limit check: stop dispatching after the limit
        elapsed_so_far = time.monotonic() - t0
        if time_limit_secs > 0 and elapsed_so_far >= time_limit_secs:
            time_limit_hit = True
            return [], []

        buyers_dispatched += 1
        res_top, res_all = await run_one_buyer(buyer, sellers_for_buyer, semaphore, max_rounds, use_llm, sentinel=sentinel)
        num_negs = len(res_all)
        progress_tracker[0] += num_negs
        # Throttle progress updates to avoid event loop bloat
        if progress_tracker[0] - last_update[0] >= 500 or progress_tracker[0] == total_est:
            last_update[0] = progress_tracker[0]
            simulation.stress_test._update_progress(progress_tracker[0], total_est)
            if verbose:
                rate = progress_tracker[0] / max(time.monotonic() - t0, 0.001)
                print(f"  [Progress] {progress_tracker[0]:,} / {total_est:,} ({progress_tracker[0]/total_est*100:.1f}%) | {rate:,.0f} negs/s", flush=True)
        return res_top, res_all

    chunk_results = []
    chunk_size = 50
    for i in range(0, len(stress_buyers), chunk_size):
        batch = stress_buyers[i : i + chunk_size]
        batch_tasks = []
        for buyer in batch:
            sellers_for_buyer = sellers_by_cat[buyer.required_category]
            batch_tasks.append(run_one_buyer_with_progress(buyer, sellers_for_buyer))
        
        batch_results = await asyncio.gather(*batch_tasks)
        chunk_results.extend(batch_results)
        
        # Non-blocking pause to simulate a realistic rolling execution over 12-15s
        await asyncio.sleep(0.40)

    for bi, (_, chunk_deals) in enumerate(chunk_results):
        if not chunk_deals:
            continue
        buyer_id = stress_buyers[bi].id
        profile = buyer_profile_map.get(buyer_id, "tier2_assembler")
        done_negs += len(chunk_deals)

        for d in chunk_deals:
            cat = d.category or ""
            strat = d.seller_strategy or "unknown"

            ss = seller_stats_agg[d.seller_id]
            ss["name"] = d.seller_name
            ss["category"] = cat
            ss["strategy"] = strat
            ss["queried"] += 1

            if getattr(d, "batna_used", False):
                batna_rejections += 1
            injection_blocks += getattr(d, "injection_blocked", 0) or 0
            total_llm_tokens += d.llm_tokens_used or 0

            if cat in by_cat:
                by_cat[cat]["total"] += 1
                by_cat[cat]["llm_tokens"] += d.llm_tokens_used or 0

            by_strat[strat]["total"] += 1

            if profile in by_profile:
                by_profile[profile]["total"] += 1

            if not d.deal_reached:
                total_failed_count += 1
                _run_failed += 1
                failure_counts[d.failure_reason] += 1
                _run_failure_ctr[d.failure_reason] += 1
                ss["failure_reasons"][d.failure_reason] += 1

                if cat in by_cat:
                    by_cat[cat]["failed"] += 1

                if len(failure_samples[d.failure_reason]) < 5:
                    failure_samples[d.failure_reason].append({
                        "seller": d.seller_name, "category": cat,
                        "price_gap_pct": round(d.price_gap_pct, 1),
                        "strategy": strat,
                    })

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

                round_dist[str(d.negotiation_rounds)] += 1
                bucket = max(0, int((d.savings_pct or 0.0) // 5)) * 5
                savings_hist[f"{bucket}"] += 1

                if cat in by_cat:
                    by_cat[cat]["success"] += 1
                    by_cat[cat]["savings_sum"] += d.savings_pct or 0.0
                    by_cat[cat]["vs_list_sum"] += d.vs_list_pct or 0.0
                    by_cat[cat]["rounds_sum"] += d.negotiation_rounds or 0
                    if d.moq_waiver_applied:
                        by_cat[cat]["moq_waivers"] += 1

                by_strat[strat]["success"] += 1
                by_strat[strat]["savings_sum"] += d.savings_pct or 0.0

                if profile in by_profile:
                    by_profile[profile]["success"] += 1
                    by_profile[profile]["savings_sum"] += d.savings_pct or 0.0
                    by_profile[profile]["vs_list_sum"] += d.vs_list_pct or 0.0

                # Top-30 deals min-heap
                score = d.composite_score or 0.0
                deal_dict = {
                    "seller_id": d.seller_id, "seller_name": d.seller_name,
                    "buyer_id": d.buyer_id, "buyer_profile": profile,
                    "category": cat,
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

    # ── Finalise aggregated stats ─────────────────────────────────────────────
    platform_fee = deal_value_sum * 0.01
    avg_savings = savings_sum_agg / max(total_success, 1)
    avg_vs_list = vs_list_sum_agg / max(total_success, 1)
    avg_rounds = rounds_sum_agg / max(total_success, 1)
    sentinel_summary = sentinel.get_summary()

    by_cat_report: dict = {}
    for cat, v in by_cat.items():
        n_ok = v["success"]
        n_all = v["total"]
        if n_all == 0:
            continue
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

    by_strat_report: dict = {}
    for strat, v in by_strat.items():
        n_ok = v["success"]
        n_all = v["total"]
        by_strat_report[strat] = {
            "total": n_all,
            "success": n_ok,
            "success_pct": round(n_ok / n_all * 100, 1) if n_all else 0,
            "avg_savings_pct": round(v["savings_sum"] / n_ok, 2) if n_ok else 0,
        }

    # Automotive-specific: by_profile report
    by_profile_report: dict = {}
    for profile, v in by_profile.items():
        n_ok = v["success"]
        n_all = v["total"]
        by_profile_report[profile] = {
            "total": n_all,
            "success": n_ok,
            "success_pct": round(n_ok / n_all * 100, 1) if n_all else 0,
            "avg_savings_pct": round(v["savings_sum"] / n_ok, 2) if n_ok else 0,
            "avg_vs_list_pct": round(v["vs_list_sum"] / n_ok, 2) if n_ok else 0,
            "desc": AUTOMOTIVE_BUYER_PROFILES[profile]["desc"],
        }

    failure_breakdown = []
    for reason, count in failure_counts.most_common():
        exp = FAILURE_EXPLANATIONS.get(reason, {
            "label": reason.replace("_", " ").title(),
            "desc": "Negotiation failed.", "fix": "Investigate.", "severity": "medium",
        })
        failure_breakdown.append({
            "reason": reason, "label": exp["label"],
            "count": count,
            "pct": round(count / total_failed_count * 100, 1) if total_failed_count else 0,
            "desc": exp["desc"], "fix": exp["fix"], "severity": exp.get("severity", "medium"),
            "samples": failure_samples[reason],
        })

    leaderboard = []
    for sid, s in seller_stats_agg.items():
        if s["queried"] < 3:
            continue
        leaderboard.append({
            "seller_id": sid, "name": s["name"],
            "strategy": s["strategy"], "category": s["category"],
            "queried": s["queried"], "closed": s["closed"],
            "success_pct": round(s["closed"] / s["queried"] * 100, 1),
            "avg_savings_pct": round(s["total_savings"] / s["closed"], 1) if s["closed"] else 0,
            "top_failure": s["failure_reasons"].most_common(1)[0][0] if s["failure_reasons"] else "",
        })
    leaderboard.sort(key=lambda x: x["success_pct"], reverse=True)

    top_deals_report = [dd for _, _tc, dd in sorted(top_deals_heap, key=lambda x: -x[0])]

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    report = {
        "meta": {
            "timestamp": ts,
            "sector": "Automotive — Indian Auto-Ancillary MSME",
            "duration_secs": round(elapsed, 3),
            "time_limit_hit": time_limit_hit,
            "engine": "SAO + Ollama LLM Hook" if use_llm else "Pure SAO Rule-Based",
            "llm_model": "qwen2.5-coder:7b" if use_llm else "disabled",
            "seed": seed,
            "buyers_per_category": n_per_category,
            "buyers_dispatched": buyers_dispatched,
            "max_rounds": max_rounds,
            "categories": list(AUTOMOTIVE_CATEGORIES),
            "total_sellers": len(all_sellers),
        },
        "summary": {
            "total_negotiations": total_neg,
            "deals_closed": total_success,
            "deals_failed": total_failed_count,
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
            "throughput_negs_per_sec": round(total_neg / max(elapsed, 0.001), 0),
        },
        "sentinel": sentinel_summary,
        "round_distribution": dict(sorted(round_dist.items(), key=lambda x: int(x[0]))),
        "savings_histogram": dict(sorted(savings_hist.items(), key=lambda x: int(x[0]))),
        "by_failure_reason": failure_breakdown,
        "by_category": by_cat_report,
        "by_strategy": by_strat_report,
        "by_buyer_profile": by_profile_report,
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
        "agent_leaderboard": leaderboard[:50],
        "top_deals": top_deals_report,
        "close_misses": close_misses,
        "findings": _build_findings(
            total_success, total_failed_count, failure_counts,
            by_cat_report, by_strat_report, by_profile_report,
            total_neg, elapsed, infinite_stock, batna_rejections, delivery_trades,
        ),
    }

    report_path = reports_dir / f"automotive_{ts}.json"
    latest_path = reports_dir / "automotive_latest.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    if verbose:
        s = report["summary"]
        print(f"\n{'='*65}", flush=True)
        print(f"AUTOMOTIVE STRESS TEST COMPLETE", flush=True)
        print(f"  Duration       : {elapsed:.2f}s", flush=True)
        print(f"  Negotiations   : {s['total_negotiations']:,}", flush=True)
        print(f"  Deals closed   : {s['deals_closed']:,} ({s['success_rate_pct']}%)", flush=True)
        print(f"  Deal value     : Rs.{s['total_deal_value_inr']:,.0f}", flush=True)
        print(f"  Platform fee   : Rs.{s['platform_fee_inr']:,.0f} (1%)", flush=True)
        print(f"  Avg savings    : {s['avg_buyer_savings_pct']:.1f}% vs budget", flush=True)
        print(f"  Avg vs list    : {s['avg_vs_list_pct']:.1f}%", flush=True)
        print(f"  MOQ waivers    : {s['moq_waivers_granted']:,}", flush=True)
        print(f"  Throughput     : {s['throughput_negs_per_sec']:,.0f} negs/s", flush=True)
        print(f"  Report         : {latest_path}", flush=True)

    simulation.stress_test._stress_running = False
    simulation.stress_test._progress_state["running"] = False
    simulation.stress_test._update_progress(total_neg, total_neg)
    return report



def _generate_automotive_stress_buyers(
    n_per_category: int,
    categories: list,
    category_config: dict,
    seed: int,
) -> list[BuyerRequirements]:
    """
    Generate automotive stress buyers with 4 OEM/aftermarket profiles.
    Attaches _profile attribute for per-profile analytics.
    """
    import random as rnd
    rnd.seed(seed)

    profiles = list(AUTOMOTIVE_BUYER_PROFILES.keys())
    profile_weights = [AUTOMOTIVE_BUYER_PROFILES[p]["w"] for p in profiles]

    strategies = ["conceder", "tit_for_tat", "boulware", "realistic", "aspirational"]
    sw = [25, 30, 20, 15, 10]
    urgencies = ["low", "normal", "high", "urgent"]
    uw = [15, 50, 25, 10]

    all_states = [
        "Maharashtra", "Tamil Nadu", "Haryana", "Gujarat", "Punjab",
        "Karnataka", "Rajasthan", "Telangana", "Uttar Pradesh", "Andhra Pradesh",
    ]

    buyers = []
    idx = 1
    for cat in categories:
        cfg = category_config[cat]
        fl, fh = cfg["floor_range"]
        ml, mh = cfg["markup"]
        avg_list = (fl + fh) / 2 * (ml + mh) / 2
        ql, qh = cfg["buyer_qty_range"]

        for _ in range(n_per_category):
            profile_key = rnd.choices(profiles, weights=profile_weights, k=1)[0]
            profile = AUTOMOTIVE_BUYER_PROFILES[profile_key]

            tp_lo, tp_hi = profile["tp_mult"]
            mp_lo, mp_hi = profile["mp_mult"]
            tp = avg_list * rnd.uniform(tp_lo, tp_hi)
            mp = avg_list * rnd.uniform(mp_lo, mp_hi)
            if tp >= mp:
                tp = mp * 0.87

            qty = int(rnd.uniform(ql, qh))
            if qty > 200:
                qty = round(qty / 50) * 50
            elif qty > 50:
                qty = round(qty / 10) * 10
            elif qty > 10:
                qty = round(qty / 5) * 5
            qty = max(qty, 5)

            quality_min = profile["quality"]
            # Aftermarket/tier2 occasionally tolerate Grade-C
            if profile_key in ("aftermarket", "tier2_assembler") and rnd.random() < 0.20:
                quality_min = "C"

            buyer = BuyerRequirements(
                id=f"AB{idx:06d}",
                name=f"{profile_key[:6].upper()}-{cat[:5]}-{idx}",
                location_state=rnd.choice(all_states),
                required_category=cat,
                quantity_units=qty,
                target_price_per_unit=round(tp, 2),
                max_price_per_unit=round(mp, 2),
                quality_min=quality_min,
                delivery_deadline_days=rnd.choice([7, 14, 21, 30, 45, 60]),
                payment_preference=rnd.choice(cfg["payment_pref"]),
                negotiation_rounds_budget=10,
                negotiation_strategy=rnd.choices(strategies, weights=sw, k=1)[0],
                urgency_level=rnd.choices(urgencies, weights=uw, k=1)[0],
                allow_moq_waiver=True,
                allow_partial_fulfillment=True,
                max_moq_premium_pct=round(rnd.uniform(3.0, 10.0), 1),
            )
            # Tag with automotive profile for reporting
            buyer._profile = profile_key
            buyers.append(buyer)
            idx += 1

    return buyers


def _build_findings(
    n_success, n_failed, failure_counts, by_cat, by_strat, by_profile,
    total_neg, elapsed, infinite_stock, batna_rejections, delivery_trades,
) -> dict:
    total_deals = n_success
    total_failed = n_failed
    success_rate = total_deals / max(total_neg, 1) * 100
    throughput = total_neg / max(elapsed, 0.001)

    top_failure = failure_counts.most_common(1)
    dominant_fail = top_failure[0][0] if top_failure else "none"
    dominant_fail_pct = top_failure[0][1] / max(total_failed, 1) * 100 if top_failure else 0

    structural_failed = sum(
        c for r, c in failure_counts.items() if r != "insufficient_stock"
    )
    structural_fail_pct = structural_failed / max(total_neg, 1) * 100

    cat_sorted = sorted(
        [(cat, v["success_pct"]) for cat, v in by_cat.items() if v["total"] > 0],
        key=lambda x: x[1]
    )
    best_cat = cat_sorted[-1] if cat_sorted else ("?", 0)
    worst_cat = cat_sorted[0] if cat_sorted else ("?", 0)

    strat_sorted = sorted(
        [(s, v["avg_savings_pct"]) for s, v in by_strat.items() if v["total"] > 0],
        key=lambda x: x[1]
    )
    best_strat_savings = strat_sorted[-1] if strat_sorted else ("?", 0)

    # Best automotive buyer profile
    profile_sorted = sorted(
        [(p, v["avg_savings_pct"]) for p, v in by_profile.items() if v["total"] > 0],
        key=lambda x: x[1]
    )
    best_profile = profile_sorted[-1] if profile_sorted else ("?", 0)
    worst_profile = profile_sorted[0] if profile_sorted else ("?", 0)

    ceiling_hit = failure_counts.get("max_rounds_no_deal", 0)
    ceiling_pct = ceiling_hit / max(total_neg, 1) * 100
    batna_pct = batna_rejections / max(total_neg, 1) * 100
    price_mismatch = failure_counts.get("price_floor_above_buyer_max", 0)
    price_mismatch_pct = price_mismatch / max(total_neg, 1) * 100
    oos_count = failure_counts.get("insufficient_stock", 0)
    counterfactual = (total_deals + oos_count) / max(total_neg, 1) * 100

    bottlenecks = []
    if dominant_fail_pct > 50:
        label = FAILURE_EXPLANATIONS.get(dominant_fail, {}).get("label", dominant_fail)
        bottlenecks.append(f"{label} dominates at {dominant_fail_pct:.0f}% of failures")
    if batna_pct > 3:
        bottlenecks.append(f"BATNA walk-aways {batna_pct:.1f}% -- market prices misaligned")
    if price_mismatch_pct > 2:
        bottlenecks.append(f"Price-too-high {price_mismatch_pct:.1f}% -- aftermarket buyers budgets too tight")
    if ceiling_pct > 1:
        bottlenecks.append(f"Round-ceiling hit {ceiling_pct:.1f}% -- enable LLM mediation for hardball standoffs")
    if not bottlenecks:
        bottlenecks.append("No structural bottlenecks -- automotive SAO engine is healthy")

    automotive_insights = []
    if best_cat[1] - worst_cat[1] > 15:
        automotive_insights.append(
            f"{best_cat[0]} has {best_cat[1]:.0f}% success vs {worst_cat[0]} at "
            f"{worst_cat[1]:.0f}% -- low MOQ/high stock availability gap"
        )
    if best_profile[1] > 0:
        automotive_insights.append(
            f"{best_profile[0]} buyers get best savings ({best_profile[1]:.1f}%); "
            f"{worst_profile[0]} buyers pay closest to list ({worst_profile[1]:.1f}%)"
        )
    if delivery_trades > 0:
        delivery_trade_pct = delivery_trades / max(total_neg, 1) * 100
        automotive_insights.append(
            f"{delivery_trade_pct:.1f}% of deals closed via delivery-date trade -- "
            f"JIT delivery premium is real in Indian auto supply chain"
        )

    return {
        "throughput_negs_per_sec": round(throughput, 0),
        "success_rate_pct": round(success_rate, 1),
        "structural_failure_pct": round(structural_fail_pct, 1),
        "counterfactual_success_if_oos_fixed_pct": round(counterfactual, 1),
        "dominant_failure": dominant_fail,
        "dominant_failure_pct": round(dominant_fail_pct, 1),
        "best_category": {"name": best_cat[0], "success_pct": round(best_cat[1], 1)},
        "worst_category": {"name": worst_cat[0], "success_pct": round(worst_cat[1], 1)},
        "best_strategy_for_savings": {
            "strategy": best_strat_savings[0],
            "avg_savings_pct": round(best_strat_savings[1], 1),
        },
        "best_buyer_profile": {
            "profile": best_profile[0],
            "avg_savings_pct": round(best_profile[1], 1),
        },
        "worst_buyer_profile": {
            "profile": worst_profile[0],
            "avg_savings_pct": round(worst_profile[1], 1),
        },
        "batna_walkaway_pct": round(batna_pct, 1),
        "price_mismatch_pct": round(price_mismatch_pct, 1),
        "round_ceiling_hit_pct": round(ceiling_pct, 1),
        "delivery_trades": delivery_trades,
        "infinite_stock_mode": infinite_stock,
        "bottlenecks": bottlenecks,
        "automotive_insights": automotive_insights,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Automotive B2B Stress Test")
    parser.add_argument("--buyers", type=int, default=1600,
                        help="Buyers per category (1600=~30s, 3300=~60s)")
    parser.add_argument("--rounds", type=int, default=10)
    parser.add_argument("--no-llm", action="store_true", default=False)
    parser.add_argument("--verbose", action="store_true", default=False)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--infinite-stock", action="store_true", default=False)
    parser.add_argument("--time-limit", type=float, default=0,
                        help="Stop dispatching new buyers after N seconds (0=no limit)")
    args = parser.parse_args()

    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    report = asyncio.run(run_automotive_stress_test(
        n_per_category=args.buyers,
        max_rounds=args.rounds,
        verbose=args.verbose,
        seed=args.seed,
        use_llm=not args.no_llm,
        infinite_stock=args.infinite_stock,
        time_limit_secs=args.time_limit,
    ))
    s = report["summary"]
    print(
        f"\nAutomotive: {s['total_negotiations']:,} negotiations | "
        f"{s['deals_closed']:,} deals ({s['success_rate_pct']}%) | "
        f"Rs.{s['total_deal_value_inr']:,.0f} GMV | "
        f"Rs.{s['platform_fee_inr']:,.0f} platform fee | "
        f"{s['throughput_negs_per_sec']:,.0f} negs/s",
        flush=True,
    )
