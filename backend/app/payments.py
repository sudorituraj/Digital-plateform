"""
Consultation fee rules and the DEMO payment gateway (client request 2026-10-01).

Rules
  • Fee: CONSULTATION_FEE (₹300 — from the public listing, NOT confirmed by the clinic yet).
  • Free follow-up: if the patient's last completed visit was ≤ 14 days before the appointment day,
    the visit is free. From day 15 they pay again.

DEMO ONLY: no gateway is connected and no money moves. Card numbers never reach this server — the
browser sends only the brand and last 4 digits. In production, replace `charge()` with a PCI-compliant
gateway's hosted checkout (e.g. Razorpay / PhonePe PG) and confirm payments via its webhook.
"""

import secrets
from datetime import UTC, date, datetime, timedelta

from pymongo.asynchronous.database import AsyncDatabase

from .errors import ApiError

CONSULTATION_FEE = 300  # INR — NEEDS CLIENT CONFIRMATION
FREE_FOLLOWUP_DAYS = 14
CURRENCY = "INR"


async def last_visit_before(db: AsyncDatabase, patient_id, day: date, exclude_id=None) -> date | None:
    """Most recent completed visit on or before `day`."""
    query = {"patient_id": patient_id, "status": "completed", "date": {"$lte": day.isoformat()}}
    if exclude_id is not None:
        query["_id"] = {"$ne": exclude_id}
    doc = await db.appointments.find_one(query, sort=[("date", -1)])
    return date.fromisoformat(doc["date"]) if doc else None


async def quote(db: AsyncDatabase, patient_id, day: date, exclude_id=None) -> dict:
    """What this appointment costs, and why."""
    last = await last_visit_before(db, patient_id, day, exclude_id) if patient_id else None
    if last and (day - last).days <= FREE_FOLLOWUP_DAYS:
        return {
            "required": False,
            "amount": 0,
            "reason": "follow_up",
            "last_visit": last.isoformat(),
            "free_until": (last + timedelta(days=FREE_FOLLOWUP_DAYS)).isoformat(),
        }
    return {
        "required": True,
        "amount": CONSULTATION_FEE,
        "reason": "after_free_period" if last else "new_visit",
        "last_visit": last.isoformat() if last else None,
        "free_until": None,
    }


def new_payment(q: dict) -> dict:
    """Payment record stored on the appointment."""
    return {
        "amount": q["amount"],
        "currency": CURRENCY,
        "status": "pending" if q["required"] else "free",
        "reason": q["reason"],
        "last_visit": q["last_visit"],
        "free_until": q["free_until"],
    }


def reference() -> str:
    return "DEMO-" + secrets.token_hex(4).upper()


def charge(method: str, details: dict) -> None:
    """DEMO gateway. Fails on purpose for the documented test inputs so failure screens can be shown."""
    if method == "card" and details.get("card_last4") == "0002":
        raise ApiError(402, "payment_declined", "Card declined (demo test card)")
    if method == "upi" and str(details.get("upi_id", "")).lower().startswith("fail"):
        raise ApiError(402, "payment_failed", "UPI payment failed (demo test ID)")


def paid(method: str, by: str, **details) -> dict:
    return {"status": "paid", "method": method, "reference": reference(), "paid_at": datetime.now(UTC), "paid_by": by,
            **{k: v for k, v in details.items() if v}}
