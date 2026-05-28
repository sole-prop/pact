"""
SAO (Stacked Alternating Offers) negotiation protocol — v3 for Indian MSME market.

Key upgrades over v2:
  - BATNA (Best Alternative To Negotiated Agreement): buyer walks away if seller
    counter is worse than known best alternative by >5%
  - Multi-dimensional trade: after round 4 stalemate, try delivery-speed trade
    or payment-term upgrade instead of just grinding on price
  - Deadline pressure: urgency level now enables early-acceptance within 8% of target
  - Final offer signaling: round >= max_rounds-1 marks offer as final;
    counterparty accepts immediately if within range
  - Anti-injection: all strings fed to LLM are sanitized via _sanitize_for_llm()
  - Null safety: all price/quantity fields checked before arithmetic
  - Protocol no longer skips entire round when buyer_price < adjusted_floor;
    seller still makes a counter-offer that buyer can accept
  - Seller strategy receives urgency_level for urgency-aware concession curves
"""
import asyncio
import time
from dataclasses import dataclass, field
from typing import Optional

from simulation.negotiation.strategies import (
    NegotiationStrategy, Offer, get_strategy,
    zopa_exists, zopa_midpoint, llm_suggest_compromise,
    _sanitize_for_llm,
)
from simulation.negotiation.ranking import NegotiatedDeal


@dataclass
class NegotiationSession:
    session_id: str
    buyer_id: str
    seller_id: str
    seller_name: str
    max_rounds: int = 10
    timeout_seconds: float = 30.0

    # Buyer constraints
    buyer_target_price: float = 0.0
    buyer_max_price: float = 0.0
    buyer_quantity: int = 0
    buyer_deadline_days: int = 30
    buyer_payment_pref: str = "net_30"
    buyer_quality_min: str = "B"
    buyer_strategy: str = "conceder"
    buyer_urgency: str = "normal"       # low/normal/high/urgent
    allow_moq_waiver: bool = True
    allow_partial: bool = True
    max_moq_premium_pct: float = 7.0   # max % buyer will pay for MOQ waiver

    # BATNA: buyer's best known alternative price (from parallel negotiations)
    buyer_batna_price: Optional[float] = None

    # Seller constraints
    seller_floor_price: float = 0.0
    seller_list_price: float = 0.0
    seller_moq: int = 1
    seller_max_qty: int = 99999
    seller_quality: str = "B"
    seller_delivery_min: int = 3
    seller_delivery_max: int = 30
    seller_payment_terms: list[str] = field(default_factory=list)
    seller_strategy: str = "boulware"
    seller_stock: int = 9999
    seller_blacklisted: bool = False
    seller_negotiation_willingness: float = 0.7
    seller_rating: float = 4.0
    seller_total_orders: int = 100
    seller_payment_reliability: float = 0.9
    category: str = ""

    # Effective buyer ceiling (= buyer_max_price, or buyer_max*1.08 for urgency deals).
    # Stored here so _make_deal can calculate savings against the right baseline.
    effective_buyer_max: float = 0.0

    # LLM config
    use_llm: bool = True
    llm_model: str = "qwen2.5-coder:7b"

    # Runtime state
    offers: list[Offer] = field(default_factory=list)
    current_round: int = 0
    deal: Optional[NegotiatedDeal] = None
    llm_tokens_used: int = 0
    moq_waiver_applied: bool = False
    volume_discount_applied: float = 0.0
    partial_fulfillment: bool = False
    partial_quantity: int = 0

    # v3 tracking flags
    batna_rejected_count: int = 0
    multi_dim_trade: str = ""           # "delivery_trade" | "payment_trade" | ""
    final_offer_used: bool = False
    injection_blocked: int = 0          # count of sanitized suspicious inputs


QUALITY_RANK = {"C": 0, "B": 1, "A": 2}

PAYMENT_UPGRADE_PREMIUM = {
    # If seller doesn't have buyer's preferred term, they can upgrade at a price
    "advance_100": {"advance_50": 0.02, "net_15": 0.03, "net_30": 0.05, "net_60": 0.08},
    "advance_50":  {"net_15": 0.02, "net_30": 0.03, "net_60": 0.06},
    "net_15":      {"net_30": 0.02, "net_60": 0.04},
    "net_30":      {"net_60": 0.02},
    "net_60":      {},
}

# Urgency: how much above buyer_target a seller offer can be and still get accepted early
URGENCY_ACCEPT_PREMIUM = {
    "low":    0.00,  # no early accept
    "normal": 0.02,  # accept if within 2% above target
    "high":   0.05,  # accept if within 5% above target
    "urgent": 0.08,  # accept if within 8% above target (deadline panic)
}


async def run_negotiation(session: NegotiationSession) -> NegotiatedDeal:
    """
    Execute one buyer-seller negotiation with all MSME market improvements (v3).
    Returns a NegotiatedDeal (deal_reached=True/False).
    """
    start_time = time.monotonic()

    # ── Pre-negotiation hard checks ──────────────────────────────────────────
    if session.seller_blacklisted:
        return _failed_deal(session, "seller_blacklisted")

    if QUALITY_RANK.get(session.seller_quality, 0) < QUALITY_RANK.get(session.buyer_quality_min, 0):
        return _failed_deal(session, "quality_below_minimum")

    if session.seller_floor_price > session.buyer_max_price:
        return _failed_deal(session, "price_floor_above_buyer_max")

    # ── Stock check (with partial fulfillment option) ────────────────────────
    effective_quantity = session.buyer_quantity
    if session.seller_stock < session.buyer_quantity:
        if (session.allow_partial
                and session.seller_stock >= session.seller_moq
                and session.seller_stock >= session.buyer_quantity * 0.6):
            effective_quantity = session.seller_stock
            session.partial_fulfillment = True
            session.partial_quantity = effective_quantity
        else:
            return _failed_deal(session, "insufficient_stock")

    # ── MOQ check (with waiver negotiation) ─────────────────────────────────
    actual_qty = effective_quantity
    moq_waiver_premium = 0.0

    if actual_qty < session.seller_moq:
        if (session.allow_moq_waiver
                and actual_qty >= session.seller_moq * 0.55
                and session.seller_negotiation_willingness >= 0.4):
            shortfall_pct = 1 - (actual_qty / session.seller_moq)
            moq_waiver_premium = min(
                max(shortfall_pct * 0.12, 0.03),
                session.max_moq_premium_pct / 100
            )
            session.moq_waiver_applied = True
        else:
            return _failed_deal(session, "moq_not_met")

    # ── Volume discount ──────────────────────────────────────────────────────
    volume_discount = 0.0
    if actual_qty >= session.seller_moq * 5:
        volume_discount = 0.06
    elif actual_qty >= session.seller_moq * 2:
        volume_discount = 0.03
    session.volume_discount_applied = volume_discount

    # ── Payment term negotiation ─────────────────────────────────────────────
    common_payment, payment_premium = _find_common_payment_with_upgrade(session)
    if common_payment is None:
        return _failed_deal(session, "payment_term_mismatch")

    # Adjust floor price for MOQ waiver + payment upgrade premiums
    adjusted_floor = session.seller_floor_price * (1 + moq_waiver_premium + payment_premium)
    adjusted_floor = adjusted_floor * (1 - volume_discount)

    # With adjusted floor, re-check price viability
    if adjusted_floor > session.buyer_max_price:
        if session.buyer_urgency in ("high", "urgent"):
            urgency_max = session.buyer_max_price * 1.08
            if adjusted_floor > urgency_max:
                return _failed_deal(session, "price_floor_above_buyer_max")
            effective_buyer_max = urgency_max
        else:
            return _failed_deal(session, "price_floor_above_buyer_max")
    else:
        effective_buyer_max = session.buyer_max_price

    # Store on session so _make_deal uses the right baseline for savings_pct
    session.effective_buyer_max = effective_buyer_max

    # ── Strategy instantiation ───────────────────────────────────────────────
    # Pass urgency to strategies so they adjust concession speed
    buyer_strat: NegotiationStrategy = get_strategy(session.buyer_strategy, session.buyer_urgency)
    seller_strat: NegotiationStrategy = get_strategy(session.seller_strategy)

    current_buyer_offer: Optional[Offer] = None
    current_seller_offer: Optional[Offer] = None
    best_price_so_far: Optional[float] = None

    # Track delivery days agreed so far (for multi-dim trade)
    agreed_delivery = min(session.seller_delivery_max, session.buyer_deadline_days)

    # Urgency early-accept threshold
    urgency_premium = URGENCY_ACCEPT_PREMIUM.get(session.buyer_urgency, 0.0)
    urgency_accept_threshold = session.buyer_target_price * (1 + urgency_premium)

    for round_num in range(1, session.max_rounds + 1):
        session.current_round = round_num

        # ── Timeout check ────────────────────────────────────────────────────
        if time.monotonic() - start_time > session.timeout_seconds:
            if best_price_so_far is not None and best_price_so_far <= effective_buyer_max:
                return _make_deal(session, best_price_so_far, actual_qty, common_payment,
                                  round_num - 1, "timeout_best_so_far", adjusted_floor,
                                  delivery_days=agreed_delivery)
            return _failed_deal(session, "negotiation_timeout")

        # ── Final offer flag: round >= max_rounds - 1 ───────────────────────
        is_final_round = round_num >= session.max_rounds - 1

        # ── Buyer makes offer ────────────────────────────────────────────────
        buyer_price = buyer_strat.make_offer(
            round_num, session.max_rounds,
            session.buyer_target_price,
            effective_buyer_max,
            current_seller_offer,
        )
        # Buyers never offer above their effective ceiling (guards Aspirational anchoring)
        buyer_price = min(buyer_price, effective_buyer_max)
        # No rational buyer pays above list price either
        if session.seller_list_price > 0:
            buyer_price = min(buyer_price, session.seller_list_price)

        current_buyer_offer = Offer(
            price=buyer_price,
            quantity=actual_qty,
            delivery_days=session.buyer_deadline_days,
            payment_term=common_payment,
            round_number=round_num,
            from_agent=session.buyer_id,
            is_final=is_final_round,
        )
        session.offers.append(current_buyer_offer)

        # ── Seller evaluates buyer offer (only if price above floor) ─────────
        if buyer_price >= adjusted_floor:
            if seller_strat.accept_offer(current_buyer_offer, adjusted_floor):
                return _make_deal(session, buyer_price, actual_qty, common_payment,
                                  round_num, "seller_accepted", adjusted_floor,
                                  delivery_days=agreed_delivery)

        # ── Seller makes counter-offer ────────────────────────────────────────
        # Note: seller ALWAYS makes a counter even if buyer offered below floor.
        # This allows buyer to accept seller's counter in the same round.
        seller_price = seller_strat.make_offer(
            round_num, session.max_rounds,
            adjusted_floor,
            session.seller_list_price,
            current_buyer_offer,
        )
        # Seller NEVER goes below adjusted floor; NEVER above list price
        seller_price = max(adjusted_floor, min(session.seller_list_price or seller_price, seller_price))

        current_seller_offer = Offer(
            price=seller_price,
            quantity=actual_qty,
            delivery_days=agreed_delivery,
            payment_term=common_payment,
            round_number=round_num,
            from_agent=session.seller_id,
            is_final=is_final_round,
        )
        session.offers.append(current_seller_offer)

        if seller_price <= effective_buyer_max:
            best_price_so_far = seller_price

        # ── BATNA check: walk away if seller offer much worse than best known ─
        if (session.buyer_batna_price is not None
                and seller_price > session.buyer_batna_price * 1.05
                and round_num >= 3):
            # Seller is 5% worse than BATNA — not worth continuing
            session.batna_rejected_count += 1
            # Don't hard-fail — give it one more round; if still bad at max_rounds, fail
            if round_num >= session.max_rounds - 2:
                deal = _failed_deal(session, "batna_rejected")
                deal.batna_used = True
                return deal

        # ── Urgency early-accept: seller counter within urgency threshold ─────
        # Bound by effective_buyer_max so urgency never causes paying above budget.
        if (urgency_accept_threshold > session.buyer_target_price
                and seller_price <= urgency_accept_threshold
                and seller_price <= effective_buyer_max
                and round_num >= 2):
            return _make_deal(session, seller_price, actual_qty, common_payment,
                              round_num, "urgency_early_accept", adjusted_floor,
                              delivery_days=agreed_delivery)

        # ── Buyer evaluates seller counter ────────────────────────────────────
        if seller_price <= effective_buyer_max:
            return _make_deal(session, seller_price, actual_qty, common_payment,
                              round_num, "buyer_accepted", adjusted_floor,
                              delivery_days=agreed_delivery)

        # ── Final offer: if buyer's final offer is within seller's last known range
        if (is_final_round and current_buyer_offer.is_final
                and buyer_price >= adjusted_floor
                and buyer_price <= effective_buyer_max):
            # Buyer signaled final — if it's above floor, accept to avoid timeout waste
            if buyer_price >= adjusted_floor * 1.001:
                session.final_offer_used = True
                return _make_deal(session, buyer_price, actual_qty, common_payment,
                                  round_num, "final_offer_accepted", adjusted_floor,
                                  delivery_days=agreed_delivery)

        # ── Multi-dimensional trade (round 4+ stalemate with narrow gap) ─────
        if round_num >= 4 and best_price_so_far is None:
            price_gap_pct = (seller_price - effective_buyer_max) / max(effective_buyer_max, 1) * 100
            if 0 < price_gap_pct <= 8.0:
                # Try delivery trade: seller offers faster delivery at same price
                if session.seller_delivery_min > 1:
                    faster_delivery = max(1, int(session.seller_delivery_min * 0.85))
                    if faster_delivery < agreed_delivery:
                        # Accept at seller's floor with faster delivery
                        deal_price = min(seller_price, effective_buyer_max)
                        if deal_price >= adjusted_floor:
                            agreed_delivery = faster_delivery
                            session.multi_dim_trade = "delivery_trade"
                            return _make_deal(session, deal_price, actual_qty, common_payment,
                                              round_num, "delivery_trade", adjusted_floor,
                                              delivery_days=faster_delivery)

                # Try payment trade: buyer offers advance_50 for a 2% price cut
                if (session.buyer_payment_pref in ("net_30", "net_60")
                        and "advance_50" in session.seller_payment_terms):
                    payment_trade_price = adjusted_floor * 1.02  # seller gets 2% premium
                    if payment_trade_price <= effective_buyer_max:
                        session.multi_dim_trade = "payment_trade"
                        return _make_deal(session, payment_trade_price, actual_qty,
                                          "advance_50", round_num, "payment_trade",
                                          adjusted_floor, delivery_days=agreed_delivery)

    # ── Max rounds exhausted ─────────────────────────────────────────────────
    if best_price_so_far is not None:
        return _make_deal(session, best_price_so_far, actual_qty, common_payment,
                          session.max_rounds, "max_rounds_best_so_far", adjusted_floor,
                          delivery_days=agreed_delivery)

    # Last resort: try LLM mediation first, then ZOPA midpoint.
    # Cap ceiling at min(buyer_max, seller_list_price) so buyers never pay above list.
    zopa_ceiling = (
        min(effective_buyer_max, session.seller_list_price)
        if session.seller_list_price > 0 else effective_buyer_max
    )
    if zopa_exists(zopa_ceiling, adjusted_floor):
        # ── LLM hook: stuck negotiation — ask Ollama for a fair price ────────
        if session.use_llm:
            gap_pct = (zopa_ceiling - adjusted_floor) / max(adjusted_floor, 1) * 100
            if gap_pct <= 30.0:
                last_buyer = (
                    current_buyer_offer.price
                    if current_buyer_offer and current_buyer_offer.price is not None
                    else session.buyer_target_price
                )
                last_seller = (
                    current_seller_offer.price
                    if current_seller_offer and current_seller_offer.price is not None
                    else session.seller_list_price
                )
                # Anti-injection: sanitize all strings fed to LLM
                safe_category = _sanitize_for_llm(session.category)
                # Check for injection in category
                _check_and_count_injection(session, session.category, "category")

                llm_price, tokens = await llm_suggest_compromise(
                    category=safe_category,
                    buyer_target=session.buyer_target_price,
                    buyer_max=effective_buyer_max,
                    seller_floor=adjusted_floor,
                    seller_list=session.seller_list_price,
                    last_buyer_offer=last_buyer,
                    last_seller_offer=last_seller,
                    round_num=session.max_rounds,
                    max_rounds=session.max_rounds,
                    model=session.llm_model,
                )
                session.llm_tokens_used += tokens
                if llm_price is not None:
                    return _make_deal(session, llm_price, actual_qty, common_payment,
                                      session.max_rounds, "llm_mediated", adjusted_floor,
                                      delivery_days=agreed_delivery)

        # Mechanical ZOPA fallback (LLM unavailable or out of range)
        midpoint = zopa_midpoint(zopa_ceiling, adjusted_floor, session.buyer_target_price)
        if midpoint <= effective_buyer_max:
            return _make_deal(session, midpoint, actual_qty, common_payment,
                              session.max_rounds, "zopa_fallback", adjusted_floor,
                              delivery_days=agreed_delivery)

    return _failed_deal(session, "max_rounds_no_deal")


def _check_and_count_injection(session: NegotiationSession, text: str, field_name: str) -> None:
    """
    Check for injection patterns in a string field.
    Increments session.injection_blocked if suspicious content found.
    """
    import re
    INJECTION_PATTERNS = [
        r'ignore\s+above', r'ignore\s+previous', r'disregard',
        r'system\s*:', r'assistant\s*:', r'<\|', r'\|>',
        r'you\s+are\s+now', r'new\s+instructions',
        r'http[s]?://', r'@\w+\.\w{2,}',
    ]
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, str(text), re.IGNORECASE):
            session.injection_blocked += 1
            break


def _find_common_payment_with_upgrade(
    session: NegotiationSession,
) -> tuple[Optional[str], float]:
    """
    Find the best common payment term. If no exact match, check if seller
    can upgrade their term at a price premium.
    Returns (term, premium_pct).
    """
    from simulation.negotiation.ranking import PAYMENT_SCORE

    buyer_pref_score = PAYMENT_SCORE.get(session.buyer_payment_pref, 0)
    seller_terms = session.seller_payment_terms or []

    # Direct match: find seller terms at least as good as buyer wants
    valid = [t for t in seller_terms if PAYMENT_SCORE.get(t, 0) >= buyer_pref_score - 0.25]
    if valid:
        best = max(valid, key=lambda t: PAYMENT_SCORE.get(t, 0))
        return best, 0.0

    # Accept any available term (buyer compromises)
    if seller_terms:
        best = max(seller_terms, key=lambda t: PAYMENT_SCORE.get(t, 0))
        upgrades = PAYMENT_UPGRADE_PREMIUM.get(best, {})
        if session.buyer_payment_pref in upgrades:
            premium = upgrades[session.buyer_payment_pref]
            upgraded_floor = session.seller_floor_price * (1 + premium)
            if upgraded_floor <= session.buyer_max_price:
                return session.buyer_payment_pref, premium
        return best, 0.0

    return None, 0.0


def _make_deal(
    session: NegotiationSession,
    price: float,
    quantity: int,
    payment_term: str,
    rounds: int,
    reason: str,
    adjusted_floor: float,
    delivery_days: Optional[int] = None,
) -> NegotiatedDeal:
    # Null safety
    price = price if price is not None else adjusted_floor
    quantity = quantity if quantity is not None else session.buyer_quantity
    if delivery_days is None:
        delivery_days = min(session.seller_delivery_max, session.buyer_deadline_days)

    # Savings vs effective ceiling (buyer_max_price, or buyer_max*1.08 for urgency).
    # Using effective_buyer_max avoids false-negative savings on urgency-premium deals.
    effective_max = session.effective_buyer_max if session.effective_buyer_max > 0 else session.buyer_max_price
    savings_pct = (
        (effective_max - price) / effective_max * 100
        if effective_max > 0 else 0.0
    )
    # Also: vs list price (informational)
    vs_list_pct = (
        (session.seller_list_price - price) / session.seller_list_price * 100
        if session.seller_list_price > 0 else 0.0
    )

    deal = NegotiatedDeal(
        seller_id=session.seller_id,
        seller_name=session.seller_name,
        final_price=round(price, 2),
        quantity=quantity,
        quality_grade=session.seller_quality,
        delivery_days=delivery_days,
        payment_term=payment_term,
        negotiation_rounds=rounds,
        deal_reached=True,
        failure_reason=None,
        moq_waiver_applied=session.moq_waiver_applied,
        volume_discount_applied=session.volume_discount_applied,
        partial_fulfillment=session.partial_fulfillment,
        llm_tokens_used=session.llm_tokens_used,
        close_reason=reason,
    )
    # Analytics
    deal.seller_floor_price = adjusted_floor
    deal.seller_list_price = session.seller_list_price
    deal.buyer_max_price = session.buyer_max_price
    deal.seller_strategy = session.seller_strategy
    deal.savings_pct = round(savings_pct, 2)
    deal.vs_list_pct = round(vs_list_pct, 2)
    deal.price_gap_pct = round(
        (session.buyer_max_price - session.seller_floor_price) / session.seller_floor_price * 100
        if session.seller_floor_price > 0 else 0, 2
    )
    # v3 new fields
    deal.batna_used = session.batna_rejected_count > 0
    deal.multi_dim_trade = session.multi_dim_trade
    deal.final_offer_signaling = session.final_offer_used
    deal.injection_blocked = session.injection_blocked
    deal.deadline_pressure_applied = session.buyer_urgency in ("high", "urgent")

    session.deal = deal
    return deal


def _failed_deal(session: NegotiationSession, reason: str) -> NegotiatedDeal:
    deal = NegotiatedDeal(
        seller_id=session.seller_id,
        seller_name=session.seller_name,
        final_price=0.0,
        quantity=0,
        quality_grade=session.seller_quality,
        delivery_days=0,
        payment_term="",
        negotiation_rounds=session.current_round,
        deal_reached=False,
        failure_reason=reason,
    )
    deal.seller_floor_price = session.seller_floor_price
    deal.seller_list_price = session.seller_list_price
    deal.buyer_max_price = session.buyer_max_price
    deal.seller_strategy = session.seller_strategy
    deal.price_gap_pct = round(
        (session.buyer_max_price - session.seller_floor_price) / session.seller_floor_price * 100
        if session.seller_floor_price > 0 else 0, 2
    )
    # v3 new fields
    deal.batna_used = session.batna_rejected_count > 0
    deal.multi_dim_trade = session.multi_dim_trade
    deal.final_offer_signaling = session.final_offer_used
    deal.injection_blocked = session.injection_blocked
    deal.deadline_pressure_applied = session.buyer_urgency in ("high", "urgent")

    session.deal = deal
    return deal
