"""Staff accounts: demo accounts for local/demo use, and helpers shared with the management command."""

import logging
from datetime import UTC, datetime

from pymongo.asynchronous.database import AsyncDatabase

from .config import Settings
from .security import hash_password, verify_password

log = logging.getLogger("saran.staff")

# Demo-only accounts, created automatically when the database has no staff (never in production).
# The login page lists them in demo mode so the client demo needs no setup.
DEMO_STAFF = [
    {"username": "reception", "password": "reception123", "role": "reception", "name": "Reception Desk"},
    {"username": "doctor", "password": "doctor123", "role": "doctor", "name": "Dr. Neela Singh"},
    {"username": "admin", "password": "admin123", "role": "admin", "name": "Clinic Admin"},
]


def demo_accounts_enabled(settings: Settings) -> bool:
    return settings.app_env != "production" and settings.otp_mode == "demo"


async def create_staff(db: AsyncDatabase, username: str, password: str, role: str, name: str) -> dict:
    now = datetime.now(UTC)
    doc = {
        "username": username.strip().lower(),
        "password_hash": hash_password(password),
        "role": role,
        "name": name,
        "active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.staff.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def seed_demo_staff(db: AsyncDatabase, settings: Settings) -> None:
    """Demo mode only: make sure the demo accounts exist and work with the passwords shown on the login page."""
    if not demo_accounts_enabled(settings):
        return
    for account in DEMO_STAFF:
        existing = await db.staff.find_one({"username": account["username"]})
        if not existing:
            await create_staff(db, account["username"], account["password"], account["role"], account["name"])
            log.info("Created demo staff account %s", account["username"])
        elif not verify_password(account["password"], existing.get("password_hash", "")):
            await db.staff.update_one(
                {"_id": existing["_id"]},
                {"$set": {"password_hash": hash_password(account["password"]), "role": account["role"], "active": True}},
            )
            log.info("Reset demo staff account %s to its demo password", account["username"])
