"""MongoDB connection (async PyMongo) and index setup."""

from pymongo import ASCENDING, DESCENDING, AsyncMongoClient, ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from .config import get_settings

_client: AsyncMongoClient | None = None


async def connect() -> AsyncDatabase:
    global _client
    settings = get_settings()
    _client = AsyncMongoClient(settings.mongodb_uri, tz_aware=True, serverSelectionTimeoutMS=5000)
    db = _client[settings.mongodb_db]
    await ensure_indexes(db)
    return db


async def close() -> None:
    if _client is not None:
        await _client.close()


def get_db() -> AsyncDatabase:
    if _client is None:
        raise RuntimeError("Database not connected")
    return _client[get_settings().mongodb_db]


async def ensure_indexes(db: AsyncDatabase) -> None:
    await db.patients.create_index("phone", unique=True)
    await db.patients.create_index("patient_code", unique=True)
    await db.appointments.create_index("request_id", unique=True)
    await db.appointments.create_index([("patient_id", ASCENDING), ("date", DESCENDING)])
    await db.appointments.create_index([("date", ASCENDING), ("status", ASCENDING)])
    # One active OTP per phone; MongoDB deletes it automatically after it expires.
    await db.otp_codes.create_index("phone", unique=True)
    await db.otp_codes.create_index("expires_at", expireAfterSeconds=0)
    # Rate-limit counters also clean themselves up.
    await db.rate_limits.create_index("expires_at", expireAfterSeconds=0)
    # Staff collection indexes
    await db.staff.create_index("username", unique=True)
    # One visit record per appointment; the doctor's notes live here (never in the patient API).
    await db.visits.create_index("appointment_id", unique=True)
    await db.visits.create_index([("patient_id", ASCENDING), ("date", DESCENDING)])
    await db.notifications.create_index([("patient_id", ASCENDING), ("created_at", DESCENDING)])
    await db.notifications.create_index("created_at")
    # Reminders carry a unique key so they are sent once, however often the check runs.
    await db.notifications.create_index("key", unique=True, partialFilterExpression={"key": {"$type": "string"}})


async def next_sequence(db: AsyncDatabase, name: str) -> int:
    """Atomic counter, used for human-friendly patient numbers (P000001, P000002, …)."""
    doc = await db.counters.find_one_and_update(
        {"_id": name}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER
    )
    return doc["seq"]
