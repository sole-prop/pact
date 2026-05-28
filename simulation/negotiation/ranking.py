"""
Multi-criteria ranking algorithm to score negotiated deals and return top-N.

MCDA Weights (updated):
  Price            40%  — primary driver for Indian MSMEs
  Delivery speed   30%  — logistics critical
  Trust / Quality  20%  — grade A/B/C
  Reputation        5%  — seller rating + order history
  Credit / Payment  5%  — net terms

v3 additions to NegotiatedDeal:
  - batna_used: bool — buyer walked away from deals worse than BATNA
  - deadline_pressure_applied: bool — urgency level changed concession speed
  - multi_dim_trade: str — "delivery_trade" | "payment_trade" | ""
  - final_offer_signaling: bool — final offer flag triggered early close
  - injection_blocked: int — sanitized suspicious inputs in this session
  - sentinel_flagged: bool — sentinel agent raised alert on this deal
"""
from dataclasses import dataclass, field
from typing import Optional


PAYMENT_SCORE = {
    "net_60": 1.0,
    "net_30": 0.75,
    "net_15": 0.50,
    "advance_50": 0.25,
    "advance_100": 0.00,
}

QUALITY_SCORE = {"A": 1.0, "B": 0.6, "C": 0.3}


@dataclass
class NegotiatedDeal:
    seller_id: str
    seller_name: str
    final_price: float
    quantity: int
    quality_grade: str
    delivery_days: int
    payment_term: str
    negotiation_rounds: int
    deal_reached: bool
    failure_reason: Optional[str] = None

    # Protocol feature flags
    moq_waiver_applied: bool = False
    volume_discount_applied: float = 0.0
    partial_fulfillment: bool = False
    llm_tokens_used: int = 0
    close_reason: str = ""

    # v3 new fields
    batna_used: bool = False
    deadline_pressure_applied: bool = False
    multi_dim_trade: str = ""          # "delivery_trade" | "payment_trade" | ""
    final_offer_signaling: bool = False
    injection_blocked: int = 0
    sentinel_flagged: bool = False

    # MCDA scoring (computed by score_deals)
    composite_score: float = field(default=0.0, init=False)
    narrative: str = field(default="", init=False)
    rank: int = field(default=0, init=False)

    # Analytics enrichment (populated post-negotiation)
    seller_strategy: str = field(default="", init=False)
    category: str = field(default="", init=False)
    buyer_id: str = field(default="", init=False)
    seller_floor_price: float = field(default=0.0, init=False)
    seller_list_price: float = field(default=0.0, init=False)
    buyer_max_price: float = field(default=0.0, init=False)
    price_gap_pct: float = field(default=0.0, init=False)
    savings_pct: float = field(default=0.0, init=False)
    vs_list_pct: float = field(default=0.0, init=False)
    offer_trajectory: list = field(default_factory=list, init=False)
    seller_rating: float = field(default=4.0, init=False)
    seller_total_orders: int = field(default=0, init=False)


def score_deals(
    deals: list[NegotiatedDeal],
    buyer_max_price: float,
    buyer_deadline_days: int,
    top_n: int = 10,
) -> list[NegotiatedDeal]:
    """
    Score all successful deals, return sorted top-N with MCDA composite scores.
    MCDA weights: Price 40%, Delivery 30%, Quality 20%, Reputation 5%, Payment 5%.
    """
    successful = [d for d in deals if d.deal_reached]
    if not successful:
        return []

    # Normalize price: lower price → higher score
    prices = [d.final_price for d in successful]
    min_price, max_price = min(prices), max(prices)
    price_range = (max_price - min_price) or 1.0

    # Normalize delivery: fewer days → higher score
    deliveries = [d.delivery_days for d in successful]
    min_del, max_del = min(deliveries), max(deliveries)
    del_range = (max_del - min_del) or 1.0

    # Reputation score (normalize rating 0-5 → 0-1)
    ratings = [d.seller_rating for d in successful]
    min_r, max_r = min(ratings), max(ratings)
    rating_range = (max_r - min_r) or 1.0

    for deal in successful:
        price_score      = (max_price - deal.final_price) / price_range
        delivery_score   = (max_del - deal.delivery_days) / del_range
        quality_score    = QUALITY_SCORE.get(deal.quality_grade, 0.3)
        payment_score    = PAYMENT_SCORE.get(deal.payment_term, 0.0)
        reputation_score = (deal.seller_rating - min_r) / rating_range

        deal.composite_score = round(
            0.40 * price_score
            + 0.30 * delivery_score
            + 0.20 * quality_score
            + 0.05 * reputation_score
            + 0.05 * payment_score,
            4,
        )

    successful.sort(key=lambda d: d.composite_score, reverse=True)
    top = successful[:top_n]

    for i, deal in enumerate(top, 1):
        deal.rank = i

    # ── Narrative badges ──────────────────────────────────────────────────────
    if top:
        best_price = min(top, key=lambda d: d.final_price)
        best_price.narrative += " | Best price"

        best_quality = max(top, key=lambda d: QUALITY_SCORE.get(d.quality_grade, 0))
        best_quality.narrative += " | Best quality"

        fastest = min(top, key=lambda d: d.delivery_days)
        fastest.narrative += " | Fastest delivery"

        best_rep = max(top, key=lambda d: d.seller_rating)
        if best_rep.seller_total_orders >= 50:
            best_rep.narrative += " | Most trusted"

        best_pay = max(top, key=lambda d: PAYMENT_SCORE.get(d.payment_term, 0))
        best_pay.narrative += " | Best payment terms"

        for d in top:
            if d.moq_waiver_applied:
                d.narrative += " | MOQ waiver"
            if d.volume_discount_applied and d.volume_discount_applied > 0:
                d.narrative += f" | Vol discount {d.volume_discount_applied * 100:.0f}%"
            if d.partial_fulfillment:
                d.narrative += " | Partial order"
            if d.llm_tokens_used and d.llm_tokens_used > 0:
                d.narrative += " | AI mediated"
            # v3 new badges
            if d.batna_used:
                d.narrative += " | BATNA negotiated"
            if d.multi_dim_trade == "delivery_trade":
                d.narrative += " | Delivery trade"
            elif d.multi_dim_trade == "payment_trade":
                d.narrative += " | Payment trade"
            if d.final_offer_signaling:
                d.narrative += " | Final offer close"
            if d.sentinel_flagged:
                d.narrative += " | ⚠ Flagged"
            if d.deadline_pressure_applied:
                d.narrative += " | Urgent"

    return top


def format_shortlist(deals: list[NegotiatedDeal], buyer_name: str = "Buyer") -> str:
    """Return a human-readable shortlist for the buyer."""
    if not deals:
        return f"No deals found for {buyer_name}. All negotiations failed."

    lines = [f"\nTop {len(deals)} deals for {buyer_name}:\n" + "=" * 60]
    for deal in deals:
        label = deal.rank or (deals.index(deal) + 1)
        savings_str = (
            f"Saved {deal.savings_pct:.1f}% vs budget"
            if deal.savings_pct > 0 else "At budget limit"
        )
        lines.append(
            f"{label}. {deal.seller_name} [{deal.seller_id}]\n"
            f"   Price: Rs.{deal.final_price:,.2f}/unit | Qty: {deal.quantity} units\n"
            f"   Quality: Grade-{deal.quality_grade} | Delivery: {deal.delivery_days} days\n"
            f"   Payment: {deal.payment_term} | Score: {deal.composite_score:.3f} | {savings_str}\n"
            f"   {deal.narrative.strip(' |') or 'Good overall deal'}"
        )
    return "\n".join(lines)
