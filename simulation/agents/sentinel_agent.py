"""
SentinelAgent: Watchdog that monitors negotiation outcomes for anomalies.

Runs passively during stress tests — receives completed NegotiatedDeal objects
and flags suspicious patterns. All checks are O(1) per deal.

Detects:
  1. Price integrity  — final price > seller list price (irrational overpaying)
  2. Savings sign flip — savings_pct < -1% (TitForTat price escalation bug resurface)
  3. LLM hallucination — LLM-suggested price below seller floor (bad Ollama output)
  4. Statistical outlier — savings pct > 3σ from running mean (data corruption)
  5. Round exhaustion spike — >30% of sessions hitting max_rounds (protocol issue)
  6. Injection attempt — suspicious strings detected in deal context fields
  7. Zero-price deals — final_price == 0 on a successful deal (aggregation bug)
  8. Duplicate deal IDs — same session_id appearing twice (concurrency bug)
"""
from __future__ import annotations

import re
import time
import logging
from collections import defaultdict
from dataclasses import dataclass, asdict, field
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from simulation.negotiation.ranking import NegotiatedDeal

logger = logging.getLogger(__name__)


# ── Injection patterns to detect in deal context ──────────────────────────────

_INJECTION_PATTERNS = [
    r'ignore\s+above',
    r'ignore\s+previous',
    r'disregard\s+instructions',
    r'system\s*:',
    r'assistant\s*:',
    r'<\s*\|',
    r'\|\s*>',
    r'you\s+are\s+now',
    r'new\s+instructions',
    r'http[s]?://',
    r'@\w{2,}\.\w{2,}',      # email-like patterns in category/seller names
    r'eval\s*\(',
    r'exec\s*\(',
    r'__import__',
]


def _has_injection(text: str) -> bool:
    """Return True if text contains potential prompt injection payload."""
    for pattern in _INJECTION_PATTERNS:
        if re.search(pattern, str(text), re.IGNORECASE):
            return True
    return False


# ── Alert dataclass ───────────────────────────────────────────────────────────

@dataclass
class SentinelAlert:
    alert_id: str
    severity: str        # "info" | "warning" | "critical"
    category: str        # "price_integrity" | "injection" | "outlier" | "protocol" | "llm" | "data"
    deal_session: str    # session ID or "aggregate"
    message: str
    timestamp: float = field(default_factory=time.time)
    auto_flagged_deal: bool = False   # whether we set deal.sentinel_flagged = True


# ── Sentinel Agent ────────────────────────────────────────────────────────────

class SentinelAgent:
    """
    Passive watchdog agent. Call monitor_deal() after each negotiation completes.
    Call get_summary() at the end of a stress test run for the report.
    """

    def __init__(self):
        self.alerts: list[SentinelAlert] = []
        # Welford's online algorithm for mean/variance — O(1) per update, O(n²) eliminated
        self._n: int = 0           # count of savings values seen
        self._mean: float = 0.0    # running mean
        self._M2: float = 0.0      # running sum of squared deviations (for variance)
        self._round_exhaustion_count: int = 0
        self._total_sessions: int = 0
        self._seen_sessions: set[str] = set()
        self._pair_failure_map: dict[str, int] = defaultdict(int)
        logger.info("SentinelAgent initialized")

    # ── Public API ─────────────────────────────────────────────────────────────

    def monitor_deal(self, deal: "NegotiatedDeal", session_id: str = "") -> list[SentinelAlert]:
        """
        Called after each negotiation completes.
        Returns list of NEW alerts raised for this deal.
        Sets deal.sentinel_flagged = True if any critical alert found.
        """
        new_alerts: list[SentinelAlert] = []
        self._total_sessions += 1

        # ── Check 0: Duplicate session IDs ──────────────────────────────────
        if session_id:
            if session_id in self._seen_sessions:
                alert = SentinelAlert(
                    alert_id=f"duplicate_session_{session_id[:20]}",
                    severity="warning",
                    category="data",
                    deal_session=session_id,
                    message=f"Duplicate session ID detected: {session_id[:50]}",
                )
                new_alerts.append(alert)
            self._seen_sessions.add(session_id)

        if not deal.deal_reached:
            # Still track round exhaustion for failed deals
            if getattr(deal, 'negotiation_rounds', 0) >= 10:
                self._round_exhaustion_count += 1
            self.alerts.extend(new_alerts)
            return new_alerts

        # ── Check 1: Zero-price deal ─────────────────────────────────────────
        if deal.final_price is None or deal.final_price <= 0:
            alert = SentinelAlert(
                alert_id="zero_price_deal",
                severity="critical",
                category="data",
                deal_session=session_id,
                message=f"Successful deal with zero/null price: seller={deal.seller_id}",
                auto_flagged_deal=True,
            )
            new_alerts.append(alert)
            deal.sentinel_flagged = True

        # ── Check 2: Price integrity (paid above list price) ─────────────────
        list_price = getattr(deal, 'seller_list_price', 0)
        if (deal.final_price and list_price and list_price > 0
                and deal.final_price > list_price * 1.001):
            pct_over = (deal.final_price - list_price) / list_price * 100
            alert = SentinelAlert(
                alert_id=f"price_above_list_{deal.seller_id}",
                severity="critical",
                category="price_integrity",
                deal_session=session_id,
                message=(
                    f"Final price Rs.{deal.final_price:.0f} is {pct_over:.1f}% "
                    f"above list price Rs.{list_price:.0f} for seller {deal.seller_id}"
                ),
                auto_flagged_deal=True,
            )
            new_alerts.append(alert)
            deal.sentinel_flagged = True

        # ── Check 3: Savings sign flip ────────────────────────────────────────
        savings = getattr(deal, 'savings_pct', None)
        if savings is not None and savings < -1.0:
            alert = SentinelAlert(
                alert_id=f"negative_savings_{deal.seller_id}",
                severity="critical",
                category="price_integrity",
                deal_session=session_id,
                message=(
                    f"Negative savings {savings:.1f}% — buyer paid above their max budget. "
                    f"Seller: {deal.seller_id}, Price: Rs.{deal.final_price:.0f}"
                ),
                auto_flagged_deal=True,
            )
            new_alerts.append(alert)
            deal.sentinel_flagged = True

        # ── Check 4: LLM hallucination ────────────────────────────────────────
        if deal.llm_tokens_used and deal.llm_tokens_used > 0:
            floor_price = getattr(deal, 'seller_floor_price', 0)
            buyer_max = getattr(deal, 'buyer_max_price', float('inf'))
            if floor_price > 0 and deal.final_price < floor_price * 0.98:
                alert = SentinelAlert(
                    alert_id=f"llm_below_floor_{deal.seller_id}",
                    severity="warning",
                    category="llm",
                    deal_session=session_id,
                    message=(
                        f"LLM-suggested price Rs.{deal.final_price:.0f} is below "
                        f"seller floor Rs.{floor_price:.0f} for {deal.seller_id}"
                    ),
                )
                new_alerts.append(alert)

        # ── Check 5: Statistical savings outlier (>3σ) ───────────────────────
        # Welford's algorithm: O(1) per call vs O(n) for statistics.stdev on a list.
        if savings is not None:
            self._n += 1
            delta = savings - self._mean
            self._mean += delta / self._n
            self._M2 += delta * (savings - self._mean)
            if self._n >= 30:
                variance = self._M2 / (self._n - 1)
                std = variance ** 0.5
                if std > 0 and abs(savings - self._mean) > 3 * std:
                    alert = SentinelAlert(
                        alert_id=f"savings_outlier_{deal.seller_id}",
                        severity="info",
                        category="outlier",
                        deal_session=session_id,
                        message=(
                            f"Savings {savings:.1f}% is {abs(savings - self._mean) / std:.1f}σ "
                            f"from mean ({self._mean:.1f}%) for seller {deal.seller_id}"
                        ),
                    )
                    new_alerts.append(alert)

        # ── Check 6: Round exhaustion spike ──────────────────────────────────
        if getattr(deal, 'negotiation_rounds', 0) >= 10:
            self._round_exhaustion_count += 1

        if self._total_sessions >= 100:
            exhaustion_rate = self._round_exhaustion_count / self._total_sessions
            if exhaustion_rate > 0.40 and self._total_sessions % 500 == 0:
                alert = SentinelAlert(
                    alert_id=f"high_exhaustion_rate_{self._total_sessions}",
                    severity="warning",
                    category="protocol",
                    deal_session="aggregate",
                    message=(
                        f"Round exhaustion rate {exhaustion_rate * 100:.1f}% "
                        f"across {self._total_sessions} sessions — "
                        "consider loosening price constraints"
                    ),
                )
                new_alerts.append(alert)

        # ── Check 7: Injection in deal category/seller fields ────────────────
        injection_count = getattr(deal, 'injection_blocked', 0)
        if injection_count and injection_count > 0:
            alert = SentinelAlert(
                alert_id=f"injection_blocked_{deal.seller_id}",
                severity="critical" if injection_count >= 2 else "warning",
                category="injection",
                deal_session=session_id,
                message=(
                    f"Injection attempt detected in {injection_count} field(s) "
                    f"for session with seller {deal.seller_id} — inputs sanitized"
                ),
                auto_flagged_deal=True,
            )
            new_alerts.append(alert)
            deal.sentinel_flagged = True

        self.alerts.extend(new_alerts)
        return new_alerts

    def check_input_field(self, text: str, field_name: str, session_id: str = "") -> Optional[SentinelAlert]:
        """
        Pre-negotiation check: scan a string field for injection before using it.
        Returns a SentinelAlert if suspicious, None otherwise.
        Call this BEFORE inserting buyer/seller names, categories into prompts.
        """
        if _has_injection(text):
            alert = SentinelAlert(
                alert_id=f"injection_pre_{field_name}_{session_id[:10]}",
                severity="critical",
                category="injection",
                deal_session=session_id or "pre_negotiation",
                message=f"Injection pattern in {field_name}: '{str(text)[:60]}'",
            )
            self.alerts.append(alert)
            logger.warning("Sentinel: injection blocked in field '%s': %s", field_name, text[:60])
            return alert
        return None

    def get_summary(self) -> dict:
        """
        Returns aggregated alert counts for the stress test report.
        Called once at the end of a run.
        """
        from collections import Counter
        by_severity = Counter(a.severity for a in self.alerts)
        by_category = Counter(a.category for a in self.alerts)

        exhaustion_rate = (
            self._round_exhaustion_count / max(self._total_sessions, 1)
        ) * 100

        return {
            "total_alerts": len(self.alerts),
            "critical": by_severity.get("critical", 0),
            "warnings": by_severity.get("warning", 0),
            "info": by_severity.get("info", 0),
            "by_category": dict(by_category),
            "round_exhaustion_rate_pct": round(exhaustion_rate, 1),
            "total_sessions_monitored": self._total_sessions,
            "sample_alerts": [
                {
                    "alert_id": a.alert_id,
                    "severity": a.severity,
                    "category": a.category,
                    "message": a.message,
                }
                for a in self.alerts[:20]   # first 20 alerts for the report
            ],
        }

    def reset(self) -> None:
        """Reset all state — call between stress test runs."""
        self.alerts.clear()
        self._n = 0
        self._mean = 0.0
        self._M2 = 0.0
        self._round_exhaustion_count = 0
        self._total_sessions = 0
        self._seen_sessions.clear()
        self._pair_failure_map.clear()


# ── Module-level singleton (shared across stress test runs) ───────────────────

_sentinel: Optional[SentinelAgent] = None


def get_sentinel() -> SentinelAgent:
    """Get or create the module-level sentinel singleton."""
    global _sentinel
    if _sentinel is None:
        _sentinel = SentinelAgent()
    return _sentinel
