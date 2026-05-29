"""
Event-Sourced Ledger for the PACT SAO Engine.
Enables O(1) append-only transaction logging and 100% deterministic session replay.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from typing import Any, Optional, Dict, List, TYPE_CHECKING

if TYPE_CHECKING:
    from simulation.negotiation.protocols import NegotiationSession

# ── Ledger Event Classes ──────────────────────────────────────────────────────

@dataclass
class LedgerEvent:
    event_type: str
    session_id: str
    timestamp: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SessionStartedEvent(LedgerEvent):
    buyer_id: str
    seller_id: str
    buyer_target_price: float
    buyer_max_price: float
    buyer_quantity: int
    seller_floor_price: float
    seller_list_price: float
    seller_moq: int
    category: str


@dataclass
class OfferProposedEvent(LedgerEvent):
    round_number: int
    from_agent: str
    price: float
    quantity: int
    delivery_days: int
    payment_term: str
    is_final: bool


@dataclass
class DealClosedEvent(LedgerEvent):
    final_price: float
    quantity: int
    delivery_days: int
    payment_term: str
    rounds_taken: int
    savings_pct: float
    moq_waiver: bool
    partial_fulfillment: bool
    multi_dim_trade: str
    close_reason: str


@dataclass
class SessionFailedEvent(LedgerEvent):
    failure_reason: str
    rounds_taken: int
    price_gap_pct: float


# ── Append-Only Transaction Journal ───────────────────────────────────────────

class EventSourcedJournal:
    """
    Append-only session transaction journal.
    Tracks state transition logs and exports/imports event streams.
    """

    def __init__(self):
        self.events: List[LedgerEvent] = []

    def append(self, event: LedgerEvent) -> None:
        self.events.append(event)

    def get_session_events(self, session_id: str) -> List[LedgerEvent]:
        return [e for e in self.events if e.session_id == session_id]

    def to_json(self) -> str:
        return json.dumps([e.to_dict() for e in self.events], indent=2)

    def write_to_file(self, file_path: str) -> None:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(self.to_json())

    @classmethod
    def from_json(cls, json_str: str) -> EventSourcedJournal:
        journal = cls()
        raw_events = json.loads(json_str)
        
        type_map = {
            "session_started": SessionStartedEvent,
            "offer_proposed": OfferProposedEvent,
            "deal_closed": DealClosedEvent,
            "session_failed": SessionFailedEvent,
        }
        
        for e in raw_events:
            etype = e.get("event_type")
            cls_def = type_map.get(etype)
            if cls_def:
                # Remove type field before instantiation
                args = {k: v for k, v in e.items() if k != "event_type"}
                event_inst = cls_def(
                    event_type=etype,
                    session_id=args.pop("session_id"),
                    timestamp=args.pop("timestamp"),
                    **args
                )
                journal.append(event_inst)
        return journal


# ── State Reconstruction Loop (Replay Engine) ─────────────────────────────────

def reconstruct_session_state(
    session_id: str,
    journal: EventSourcedJournal,
    empty_session: NegotiationSession
) -> NegotiationSession:
    """
    Replays all event transitions from the journal to deterministicly reconstruct
    the final state of a NegotiationSession.
    """
    from simulation.negotiation.strategies import Offer
    from simulation.negotiation.ranking import NegotiatedDeal

    events = journal.get_session_events(session_id)
    if not events:
        raise ValueError(f"No events found for session: {session_id}")

    for event in events:
        if isinstance(event, SessionStartedEvent):
            empty_session.buyer_id = event.buyer_id
            empty_session.seller_id = event.seller_id
            empty_session.buyer_target_price = event.buyer_target_price
            empty_session.buyer_max_price = event.buyer_max_price
            empty_session.buyer_quantity = event.buyer_quantity
            empty_session.seller_floor_price = event.seller_floor_price
            empty_session.seller_list_price = event.seller_list_price
            empty_session.seller_moq = event.seller_moq
            empty_session.category = event.category
            empty_session.offers = []
            empty_session.deal = None

        elif isinstance(event, OfferProposedEvent):
            offer = Offer(
                price=event.price,
                quantity=event.quantity,
                delivery_days=event.delivery_days,
                payment_term=event.payment_term,
                round_number=event.round_number,
                from_agent=event.from_agent,
                is_final=event.is_final
            )
            empty_session.offers.append(offer)
            empty_session.current_round = event.round_number

        elif isinstance(event, DealClosedEvent):
            deal = NegotiatedDeal(
                seller_id=empty_session.seller_id,
                seller_name=empty_session.seller_name,
                final_price=event.final_price,
                quantity=event.quantity,
                quality_grade=empty_session.seller_quality,
                delivery_days=event.delivery_days,
                payment_term=event.payment_term,
                negotiation_rounds=event.rounds_taken,
                deal_reached=True,
                moq_waiver_applied=event.moq_waiver,
                volume_discount_applied=empty_session.volume_discount_applied,
                partial_fulfillment=event.partial_fulfillment,
                llm_tokens_used=empty_session.llm_tokens_used,
                close_reason=event.close_reason
            )
            deal.savings_pct = event.savings_pct
            deal.multi_dim_trade = event.multi_dim_trade
            empty_session.deal = deal

        elif isinstance(event, SessionFailedEvent):
            deal = NegotiatedDeal(
                seller_id=empty_session.seller_id,
                seller_name=empty_session.seller_name,
                final_price=0.0,
                quantity=0,
                quality_grade=empty_session.seller_quality,
                delivery_days=0,
                payment_term="",
                negotiation_rounds=event.rounds_taken,
                deal_reached=False,
                failure_reason=event.failure_reason
            )
            empty_session.deal = deal

    return empty_session
