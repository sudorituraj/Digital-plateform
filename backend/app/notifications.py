"""
Patient notifications (scope §11). Every message is stored and shown in the patient's in-app inbox.
WhatsApp/SMS delivery is SIMULATED: nothing leaves the server — staff can see the "outbox" instead.
A real provider can later be plugged into `deliver()` once the clinic approves the workflow, consent and cost.

Types: submitted · confirmed · reminder (day before) · rescheduled · cancelled · follow_up (reminder)
"""

import logging
from datetime import UTC, datetime, timedelta

from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import DuplicateKeyError

from . import clinic

log = logging.getLogger("saran.notify")

TYPES = ["submitted", "confirmed", "reminder", "rescheduled", "cancelled", "follow_up"]
FOLLOW_UP_NOTICE_DAYS = 2  # remind this many days before the follow-up date


def deliver(doc: dict) -> str:
    """Hand the message to WhatsApp/SMS. Demo: simulated only (no cost, no real message)."""
    log.info("SIMULATED WhatsApp to ******%s: %s %s", doc["phone"][-4:], doc["type"], doc.get("request_id") or "")
    return "simulated"


async def notify(db: AsyncDatabase, kind: str, *, patient: dict | None = None, appt: dict | None = None,
                 key: str | None = None, **params) -> None:
    """Record a message for the patient (idempotent when `key` is given). Never breaks the main action."""
    try:
        if patient is None:
            patient = await db.patients.find_one({"_id": appt["patient_id"]}, {"phone": 1, "name": 1})
        doc = {
            "patient_id": patient["_id"],
            "appointment_id": appt["_id"] if appt else None,
            "request_id": appt["request_id"] if appt else None,
            "type": kind,
            "params": {
                **({"date": appt["date"], "time_slot": appt["time_slot"]} if appt else {}),
                **{k: v for k, v in params.items() if v is not None},
            },
            "phone": patient["phone"],
            "patient_name": (appt or {}).get("patient_name") or patient.get("name"),
            "channel": "whatsapp",
            "created_at": datetime.now(UTC),
            "read_at": None,
            **({"key": key} if key else {}),
        }
        doc["delivery"] = deliver(doc)
        await db.notifications.insert_one(doc)
    except DuplicateKeyError:
        pass  # this reminder was already sent
    except Exception:  # a failed message must never undo a booking or status change
        log.exception("Could not record %s notification", kind)


async def run_due_reminders(db: AsyncDatabase) -> None:
    """Day-before reminders for confirmed appointments, and follow-up reminders. Safe to call often:
    each reminder has a unique key, so it is created only once. Called on normal page loads and by
    `python -m app.manage send-reminders` (for a daily scheduled job in production)."""
    today = clinic.today()
    tomorrow = (today + timedelta(days=1)).isoformat()
    async for appt in db.appointments.find({"date": tomorrow, "status": "confirmed"}):
        await notify(db, "reminder", appt=appt, key=f"reminder:{appt['_id']}")

    window_end = (today + timedelta(days=FOLLOW_UP_NOTICE_DAYS)).isoformat()
    async for patient in db.patients.find({"follow_up_date": {"$gte": today.isoformat(), "$lte": window_end}}):
        booked = await db.appointments.find_one({
            "patient_id": patient["_id"],
            "status": {"$in": clinic.ACTIVE_STATUSES},
            "date": {"$gte": today.isoformat()},
        })
        if not booked:  # no need to remind someone who has already booked
            await notify(db, "follow_up", patient=patient, key=f"follow_up:{patient['_id']}:{patient['follow_up_date']}",
                         follow_up_date=patient["follow_up_date"])
