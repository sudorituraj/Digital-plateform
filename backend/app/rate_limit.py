"""Tiny fixed-window rate limiter stored in MongoDB (works across multiple server processes)."""

from datetime import UTC, datetime, timedelta

from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from .errors import ApiError


def _window(key: str, window_seconds: int) -> tuple[str, int, datetime]:
    now = datetime.now(UTC)
    window_start = int(now.timestamp()) // window_seconds * window_seconds
    return f"{key}:{window_start}", window_start, now


async def count(db: AsyncDatabase, key: str, window_seconds: int) -> int:
    """How many times `key` was recorded in the current window (does not add one)."""
    doc = await db.rate_limits.find_one({"_id": _window(key, window_seconds)[0]})
    return doc["count"] if doc else 0


async def record(db: AsyncDatabase, key: str, window_seconds: int) -> None:
    """Add one to `key` for the current window (e.g. a failed password)."""
    doc_id, _, now = _window(key, window_seconds)
    await db.rate_limits.update_one(
        {"_id": doc_id},
        {"$inc": {"count": 1}, "$setOnInsert": {"expires_at": now + timedelta(seconds=window_seconds)}},
        upsert=True,
    )


async def hit(db: AsyncDatabase, key: str, limit: int, window_seconds: int) -> None:
    """Count one request for `key`; raise 429 once `limit` is exceeded within the window."""
    doc_id, window_start, now = _window(key, window_seconds)
    doc = await db.rate_limits.find_one_and_update(
        {"_id": doc_id},
        {
            "$inc": {"count": 1},
            "$setOnInsert": {"expires_at": now + timedelta(seconds=window_seconds)},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    if doc["count"] > limit:
        retry = window_start + window_seconds - int(now.timestamp())
        raise ApiError(429, "rate_limited", "Too many requests. Please try again later.", retry_after=retry)
