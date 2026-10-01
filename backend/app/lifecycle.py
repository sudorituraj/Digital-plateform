"""
Appointment lifecycle — the single place that decides which status changes are allowed.

    request_submitted ─┬─> confirmed ──┬─> checked_in ─> waiting ─> completed
                       │               │        └──────────────────> completed
                       └───────────────┘   (arrived without confirming first)
    Any open status ───> cancelled          completed / cancelled are final.
"""

import secrets
from datetime import UTC, datetime

from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import DuplicateKeyError

from .db import next_sequence
from .errors import ApiError

TRANSITIONS: dict[str, set[str]] = {
    "request_submitted": {"confirmed", "checked_in", "cancelled"},
    "confirmed": {"checked_in", "cancelled"},
    "checked_in": {"waiting", "completed", "cancelled"},
    "waiting": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}

# Statuses that need the patient to be physically at the clinic today.
SAME_DAY_ONLY = {"checked_in", "waiting", "completed"}

# No 0/O/1/I/L — easy to read out over the phone.
ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def new_request_id() -> str:
    return "SNH-" + "".join(secrets.choice(ID_ALPHABET) for _ in range(6))


def history_entry(status: str, by: str, note: str | None = None) -> dict:
    entry = {"status": status, "at": datetime.now(UTC), "by": by}
    if note:
        entry["note"] = note
    return entry


def check_transition(current: str, new: str) -> None:
    if new not in TRANSITIONS.get(current, set()):
        raise ApiError(409, "invalid_transition", f"Cannot change from {current} to {new}", current=current)


async def next_token(db: AsyncDatabase, day: str) -> int:
    """Queue number for the day: 1, 2, 3… in check-in order."""
    return await next_sequence(db, f"token:{day}")


async def insert_appointment(db: AsyncDatabase, doc: dict) -> dict:
    """Insert with a fresh human-friendly request ID (retries on the rare collision)."""
    for _ in range(5):
        doc["request_id"] = new_request_id()
        try:
            await db.appointments.insert_one(doc)
            return doc
        except DuplicateKeyError:
            doc.pop("_id", None)
    raise ApiError(500, "server_error", "Could not create appointment")
