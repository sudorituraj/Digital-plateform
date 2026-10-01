"""
Clinic booking rules. Kept in one place so they are easy to change.

Confirmed by the client (2026-10-01): the doctor sees patients 10:00 AM – 4:00 PM, and patients may
book at most 7 days ahead. Working days are not confirmed yet, so every day is bookable.
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

CLINIC_TZ = ZoneInfo("Asia/Kolkata")

DOCTOR = {"id": "dr-neela-singh", "name": "Dr. Neela Singh"}

OPENING_HOUR = 10  # 10:00 AM
CLOSING_HOUR = 16  # 4:00 PM

# Patients request a 2-hour window, not an exact minute (DECISIONS.md D3). Start/end hours, clinic time.
SLOT_HOURS: dict[str, tuple[int, int]] = {
    "morning": (10, 12),  # 10 AM – 12 PM
    "midday": (12, 14),  # 12 PM – 2 PM
    "afternoon": (14, 16),  # 2 PM – 4 PM
}
TIME_SLOTS = list(SLOT_HOURS)

PATIENT_WINDOW_DAYS = 7  # patients: today + next 7 days (client rule)
STAFF_WINDOW_DAYS = 30  # reception can book further ahead (e.g. a follow-up in 2–4 weeks)
CLOSED_WEEKDAYS: list[int] = []  # NEEDS CLIENT CONFIRMATION — e.g. [6] for Sunday (Mon=0)
MAX_ACTIVE_REQUESTS = 3  # stops accidental or abusive repeat bookings

ACTIVE_STATUSES = ["request_submitted", "confirmed", "checked_in", "waiting"]
ALL_STATUSES = [*ACTIVE_STATUSES, "completed", "cancelled"]


def now() -> datetime:
    from .config import get_settings  # local import: config must not depend on clinic

    current = datetime.now(CLINIC_TZ)
    hour = get_settings().fixed_clock_hour  # browser-test server only (see frontend/tests/e2e)
    return current.replace(hour=hour, minute=0) if hour is not None else current


def today() -> date:
    return now().date()


def open_slots(day: date, at: datetime | None = None) -> list[str]:
    """Windows a patient can still choose on `day`: today only those that haven't ended yet."""
    at = at or now()
    if day != at.date():
        return list(TIME_SLOTS)
    return [s for s, (_, end) in SLOT_HOURS.items() if at.hour < end]


def bookable_dates(for_staff: bool = False) -> list[date]:
    """Patients: today (if a window is still open) + the next 7 days. Staff: today + 30 days."""
    start = today()
    window = STAFF_WINDOW_DAYS if for_staff else PATIENT_WINDOW_DAYS
    days = [start + timedelta(days=i) for i in range(window + 1)]
    days = [d for d in days if d.weekday() not in CLOSED_WEEKDAYS]
    if not for_staff and not open_slots(start):
        days = [d for d in days if d != start]  # after 4 PM nothing is left today
    return days
