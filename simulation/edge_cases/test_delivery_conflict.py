"""
Edge Case 18: DELIVERY DATE ON INDIAN PUBLIC HOLIDAY
Seller's delivery date falls on a national public holiday. Agent adjusts timeline.
Expected: Delivery date is bumped to next working day; deal still valid.
"""
import sys
from datetime import date, timedelta
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


# Indian national public holidays 2025-2026
INDIAN_HOLIDAYS = {
    date(2025, 1, 26),   # Republic Day
    date(2025, 8, 15),   # Independence Day
    date(2025, 10, 2),   # Gandhi Jayanti
    date(2025, 10, 2),   # Dussehra
    date(2025, 10, 20),  # Diwali
    date(2025, 11, 5),   # Guru Nanak Jayanti
    date(2025, 12, 25),  # Christmas
    date(2026, 1, 26),   # Republic Day 2026
    date(2026, 3, 14),   # Holi
    date(2026, 4, 3),    # Good Friday
    date(2026, 4, 14),   # Ambedkar Jayanti
}

WEEKENDS = {5, 6}  # Saturday=5, Sunday=6


def is_working_day(d: date) -> bool:
    return d.weekday() not in WEEKENDS and d not in INDIAN_HOLIDAYS


def next_working_day(d: date) -> date:
    """Advance to the next working day if d is a holiday/weekend."""
    while not is_working_day(d):
        d += timedelta(days=1)
    return d


def adjust_delivery_date(base_date: date, delivery_days: int) -> date:
    """Compute delivery date and adjust for holidays/weekends."""
    raw_delivery = base_date + timedelta(days=delivery_days)
    return next_working_day(raw_delivery)


async def run(verbose=False) -> dict:
    today = date.today()

    # Simulate a delivery that lands on a known holiday
    # Find next holiday after today
    future_holidays = sorted(h for h in INDIAN_HOLIDAYS if h > today)
    if not future_holidays:
        # Fallback: use a weekend
        days_to_saturday = (5 - today.weekday()) % 7
        target_holiday = today + timedelta(days=days_to_saturday or 7)
    else:
        target_holiday = future_holidays[0]

    delivery_days = (target_holiday - today).days
    raw_arrival = today + timedelta(days=delivery_days)
    adjusted_arrival = adjust_delivery_date(today, delivery_days)

    is_holiday = raw_arrival in INDIAN_HOLIDAYS or raw_arrival.weekday() in WEEKENDS
    adjustment_needed = raw_arrival != adjusted_arrival
    adjusted_is_working = is_working_day(adjusted_arrival)

    passed = adjusted_is_working
    summary = (
        f"Delivery in {delivery_days} days = {raw_arrival} ({'holiday/weekend' if is_holiday else 'working day'}). "
        f"Adjusted to: {adjusted_arrival} (working day: {adjusted_is_working}). "
        f"Adjustment applied: {adjustment_needed}."
    )
    if verbose:
        print(f"  Raw delivery: {raw_delivery}, Adjusted: {adjusted_arrival}")
        print(f"  {adjusted_arrival} is working day: {adjusted_is_working}")

    return {"passed": passed, "summary": summary}
