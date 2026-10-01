"""
Clinic booking rules. Kept in one place so they are easy to change once the clinic
confirms its real schedule (days, hours, how far ahead patients may book).
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

CLINIC_TZ = ZoneInfo("Asia/Kolkata")

DOCTOR = {"id": "dr-neela-singh", "name": "Dr. Neela Singh"}

# Patients request a part of the day, not an exact slot (DECISIONS.md D3).
TIME_SLOTS = ["morning", "afternoon", "evening"]

BOOKING_WINDOW_DAYS = 30  # today + next 30 days
CLOSED_WEEKDAYS: list[int] = []  # NEEDS CLIENT CONFIRMATION — e.g. [6] for Sunday (Mon=0)
MAX_ACTIVE_REQUESTS = 3  # stops accidental or abusive repeat bookings

ACTIVE_STATUSES = ["request_submitted", "confirmed", "checked_in", "waiting"]
ALL_STATUSES = [*ACTIVE_STATUSES, "completed", "cancelled"]


def today() -> date:
    return datetime.now(CLINIC_TZ).date()


def bookable_dates() -> list[date]:
    start = today()
    days = (start + timedelta(days=i) for i in range(BOOKING_WINDOW_DAYS + 1))
    return [d for d in days if d.weekday() not in CLOSED_WEEKDAYS]
