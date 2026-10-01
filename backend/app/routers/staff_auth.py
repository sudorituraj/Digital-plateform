"""Staff login (username + password). Separate cookie from patients; roles checked on every request."""

import logging

from fastapi import APIRouter, Depends, Request, Response

from .. import rate_limit
from ..config import Settings, get_settings
from ..db import get_db
from ..errors import ApiError
from ..schemas import DemoAccountOut, StaffLoginIn, StaffOut, StaffSessionOut
from ..security import clear_session, client_ip, create_session, current_staff, hash_password, verify_password
from ..staff_accounts import DEMO_STAFF, demo_accounts_enabled

router = APIRouter(prefix="/staff", tags=["staff auth"])
log = logging.getLogger("saran.staff")

LOGIN_MAX_FAILS = 5  # wrong passwords per username…
LOGIN_LOCK_SECONDS = 900  # …within 15 minutes lock that username
_DUMMY_HASH = hash_password("not-a-real-password")  # keeps timing the same for unknown usernames


def staff_out(doc: dict) -> StaffOut:
    return StaffOut(username=doc["username"], name=doc["name"], role=doc["role"])


@router.post("/login", response_model=StaffOut)
async def login(body: StaffLoginIn, request: Request, response: Response, settings: Settings = Depends(get_settings)):
    db = get_db()
    await rate_limit.hit(db, f"staff-ip:{client_ip(request, settings)}", 30, 3600)
    fail_key = f"staff-fail:{body.username}"
    if await rate_limit.count(db, fail_key, LOGIN_LOCK_SECONDS) >= LOGIN_MAX_FAILS:
        raise ApiError(429, "login_locked", "Too many wrong passwords. Try again in 15 minutes.")

    staff = await db.staff.find_one({"username": body.username, "active": {"$ne": False}})
    if not verify_password(body.password, staff["password_hash"] if staff else _DUMMY_HASH) or not staff:
        await rate_limit.record(db, fail_key, LOGIN_LOCK_SECONDS)
        log.warning("Failed staff login for %r", body.username)
        raise ApiError(401, "invalid_credentials", "Wrong username or password")

    create_session(response, str(staff["_id"]), staff["role"], settings, staff=True)
    log.info("Staff %s (%s) logged in", staff["username"], staff["role"])
    return staff_out(staff)


@router.post("/logout", status_code=204)
async def logout(response: Response, settings: Settings = Depends(get_settings)):
    clear_session(response, settings, staff=True)


@router.get("/session", response_model=StaffSessionOut)
async def session(request: Request, settings: Settings = Depends(get_settings)):
    """Who is logged in on the staff side? Always 200 (staff or null)."""
    try:
        return StaffSessionOut(staff=staff_out(await current_staff(request, settings)))
    except ApiError:
        return StaffSessionOut(staff=None)


@router.get("/demo-accounts", response_model=list[DemoAccountOut])
async def demo_accounts(settings: Settings = Depends(get_settings)):
    """Demo credentials for the login page. Empty outside demo mode — never exposed in production."""
    if not demo_accounts_enabled(settings):
        return []
    return [DemoAccountOut(**{k: a[k] for k in ("username", "password", "role")}) for a in DEMO_STAFF]
