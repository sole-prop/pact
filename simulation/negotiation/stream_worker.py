"""
Distributed Stream Worker for PACT (Phase 2.5).
Manages partition-aware event queues, consumer group scaling, and robust stream replay.
Ensures strict, sequential message ordering within partitions to eliminate race conditions.
"""
from __future__ import annotations

import logging
import threading
import queue
from typing import Dict, List, Any, Callable, Optional

from db.stream_client import get_stream_client
from simulation.negotiation.event_sourced_ledger import EventSourcedJournal, reconstruct_session_state
from simulation.negotiation.protocols import NegotiationSession

logger = logging.getLogger(__name__)


class DistributedStreamWorker:
    """
    Stateful consumer worker that listens to partition event streams.
    Guarantees strict sequential processing per-session using partition-aware FIFO queues.
    """
    def __init__(self, worker_id: str, consumer_group: str = "negotiation-worker-group"):
        self.worker_id = worker_id
        self.consumer_group = consumer_group
        
        # Partition-aware processing queues: Partition ID -> Thread-safe FIFO Queue
        self._partition_queues: Dict[int, queue.Queue] = {
            0: queue.Queue(),
            1: queue.Queue(),
            2: queue.Queue()
        }
        
        # Thread handles for active partitions
        self._partition_threads: Dict[int, threading.Thread] = {}
        self._running = False
        
        # Local state cache to mimic Redis session partition mapping
        self.reconstructed_sessions: Dict[str, NegotiationSession] = {}
        self._state_lock = threading.Lock()

    def start(self) -> None:
        """Start the partition consumer threads and register stream subscriber hooks."""
        self._running = True
        logger.info(f"[Worker {self.worker_id}] Launching partition loops...")
        
        for p_id in self._partition_queues.keys():
            t = threading.Thread(target=self._process_partition_loop, args=(p_id,), daemon=True)
            self._partition_threads[p_id] = t
            t.start()

        # Connect to stream broker
        client = get_stream_client()
        client.subscribe(
            topic="negotiation_lifecycle",
            consumer_group=self.consumer_group,
            callback=self._on_message_received
        )
        logger.info(f"[Worker {self.worker_id}] Subscribed to negotiation_lifecycle stream.")

    def stop(self) -> None:
        self._running = False
        # Push poisoning pills to unblock queue waits
        for q in self._partition_queues.values():
            q.put(None)

    def _on_message_received(self, key: str, value: Dict[str, Any], partition: int, offset: int) -> None:
        """Broker callback: routes incoming message packet atomically to partition queues."""
        if not self._running:
            return
        
        msg_packet = {
            "key": key,
            "value": value,
            "partition": partition,
            "offset": offset
        }
        # Push to FIFO queue
        self._partition_queues[partition].put(msg_packet)

    def _process_partition_loop(self, partition_id: int) -> None:
        """Isolated thread consumer that processes messages for one partition sequentially."""
        logger.info(f"[Worker {self.worker_id} | Partition {partition_id}] Loop active.")
        q = self._partition_queues[partition_id]
        
        while self._running:
            try:
                msg = q.get()
                if msg is None:  # Poison pill to shutdown
                    break
                
                key = msg["key"]
                value = msg["value"]
                offset = msg["offset"]
                
                logger.debug(f"[Partition {partition_id}] Processing Offset-{offset} | Session: {key}")
                self._apply_event_to_state(key, value)
                
                q.task_done()
            except Exception as e:
                logger.error(f"Error in partition loop: {e}", exc_info=True)

    def _apply_event_to_state(self, session_id: str, event_data: Dict[str, Any]) -> None:
        """Updates or initializes the session context inside the local cache partition thread-safely."""
        from simulation.negotiation.strategies import Offer
        from simulation.negotiation.ranking import NegotiatedDeal
        
        etype = event_data.get("event_type")
        
        with self._state_lock:
            # 1. Session Started
            if etype == "session_started":
                session = NegotiationSession(
                    session_id=session_id,
                    buyer_id=event_data["buyer_id"],
                    seller_id=event_data["seller_id"],
                    seller_name="Worker-Seller",  # placeholder, updated during deal if needed
                    buyer_target_price=event_data["buyer_target_price"],
                    buyer_max_price=event_data["buyer_max_price"],
                    buyer_quantity=event_data["buyer_quantity"],
                    seller_floor_price=event_data["seller_floor_price"],
                    seller_list_price=event_data["seller_list_price"],
                    seller_moq=event_data["seller_moq"],
                    category=event_data["category"],
                    offers=[]
                )
                self.reconstructed_sessions[session_id] = session
                logger.info(f"[State Init] Reconstructed shell for session: {session_id}")
            
            # 2. Offer Proposed
            elif etype == "offer_proposed":
                session = self.reconstructed_sessions.get(session_id)
                if session:
                    offer = Offer(
                        price=event_data["price"],
                        quantity=event_data["quantity"],
                        delivery_days=event_data["delivery_days"],
                        payment_term=event_data["payment_term"],
                        round_number=event_data["round_number"],
                        from_agent=event_data["from_agent"],
                        is_final=event_data["is_final"]
                    )
                    session.offers.append(offer)
                    session.current_round = event_data["round_number"]
                    logger.debug(f"[State Update] Appended Offer: Round {offer.round_number} | Price: {offer.price}")
            
            # 3. Deal Closed
            elif etype == "deal_closed":
                session = self.reconstructed_sessions.get(session_id)
                if session:
                    deal = NegotiatedDeal(
                        seller_id=session.seller_id,
                        seller_name=session.seller_name,
                        final_price=event_data["final_price"],
                        quantity=event_data["quantity"],
                        quality_grade=session.seller_quality,
                        delivery_days=event_data["delivery_days"],
                        payment_term=event_data["payment_term"],
                        negotiation_rounds=event_data["rounds_taken"],
                        deal_reached=True,
                        moq_waiver_applied=event_data["moq_waiver"],
                        partial_fulfillment=event_data["partial_fulfillment"],
                        close_reason=event_data["close_reason"]
                    )
                    deal.savings_pct = event_data["savings_pct"]
                    deal.multi_dim_trade = event_data["multi_dim_trade"]
                    session.deal = deal
                    logger.info(f"[State Success] Deal Closed for session: {session_id} | Final Price: Rs.{deal.final_price:.2f}")

            # 4. Session Failed
            elif etype == "session_failed":
                session = self.reconstructed_sessions.get(session_id)
                if session:
                    deal = NegotiatedDeal(
                        seller_id=session.seller_id,
                        seller_name=session.seller_name,
                        final_price=0.0,
                        quantity=0,
                        quality_grade=session.seller_quality,
                        delivery_days=0,
                        payment_term="",
                        negotiation_rounds=event_data["rounds_taken"],
                        deal_reached=False,
                        failure_reason=event_data["failure_reason"]
                    )
                    session.deal = deal
                    logger.info(f"[State Fail] Session Failed: {session_id} | Reason: {deal.failure_reason}")
