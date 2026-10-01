"""Sessions (signed JWT in an httpOnly cookie), OTP hashing and the current-patient dependency."""

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from bson import ObjectId
from fastapi import Depends, Request, Response
import bcrypt

from .config import Settings, get_settings
from .db import get_db
from .errors import ApiError

SESSION_COOKIE = "snh_session"
JWT_ALG = "HS256"


# ---- Password hashing ----------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=get_settings().bcrypt_rounds)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:  # malformed hash or over-long password
        return False


# ---- OTP -----------------------------------------------------------------------------------------

def generate_otp(length: int) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def hash_otp(phone: str, code: str, settings: Settings) -> str:
    """OTPs are never stored in plain text. Keyed hash: useless without SECRET_KEY."""
    msg = f"{phone}:{code}".encode()
    return hmac.new(settings.secret_key.encode(), msg, hashlib.sha256).hexdigest()


def otp_matches(stored_hash: str, phone: str, code: str, settings: Settings) -> bool:
    return hmac.compare_digest(stored_hash, hash_otp(phone, code, settings))


# ---- Sessions ------------------------------------------------------------------------------------

STAFF_COOKIE = "snh_staff"  # separate from the patient cookie: a shared clinic PC never mixes the two
STAFF_SESSION_HOURS = 12  # one working day


def create_session(response: Response, subject: str, role: str, settings: Settings, *, staff: bool = False) -> None:
    seconds = STAFF_SESSION_HOURS * 3600 if staff else settings.session_days * 86400
    expires = datetime.now(UTC) + timedelta(seconds=seconds)
    token = jwt.encode({"sub": subject, "role": role, "exp": expires}, settings.secret_key, algorithm=JWT_ALG)
    response.set_cookie(
        STAFF_COOKIE if staff else SESSION_COOKIE,
        token,
        max_age=seconds,
        httponly=True,  # JavaScript cannot read it (protects against XSS token theft)
        secure=settings.cookie_secure,  # HTTPS only in production
        samesite="lax",  # not sent on cross-site POSTs (CSRF protection)
        path="/",
    )


def clear_session(response: Response, settings: Settings, *, staff: bool = False) -> None:
    response.delete_cookie(
        STAFF_COOKIE if staff else SESSION_COOKIE, path="/", secure=settings.cookie_secure, httponly=True, samesite="lax"
    )


def read_session(request: Request, settings: Settings, *, staff: bool = False) -> dict | None:
    token = request.cookies.get(STAFF_COOKIE if staff else SESSION_COOKIE)
    if not token:
        return None
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


async def current_patient(request: Request, settings: Settings = Depends(get_settings)) -> dict:
    """FastAPI dependency: the logged-in patient document, or 401."""
    claims = read_session(request, settings)
    if not claims or claims.get("role") != "patient" or not ObjectId.is_valid(claims.get("sub", "")):
        raise ApiError(401, "not_authenticated", "Please log in")
    patient = await get_db().patients.find_one({"_id": ObjectId(claims["sub"])})
    if not patient:
        raise ApiError(401, "not_authenticated", "Please log in")
    return patient


def client_ip(request: Request, settings: Settings) -> str:
    # Behind a hosting proxy the real IP arrives in X-Forwarded-For. Only trust that header when
    # TRUST_PROXY=true — otherwise anyone could fake it to dodge rate limits.
    forwarded = request.headers.get("x-forwarded-for")
    if settings.trust_proxy and forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


STAFF_ROLES = ("admin", "reception", "doctor")


async def current_staff(request: Request, settings: Settings = Depends(get_settings)) -> dict:
    """FastAPI dependency: the logged-in, active staff member, or 401."""
    claims = read_session(request, settings, staff=True)
    if not claims or claims.get("role") not in STAFF_ROLES or not ObjectId.is_valid(claims.get("sub", "")):
        raise ApiError(401, "not_authenticated", "Please log in")
    staff = await get_db().staff.find_one({"_id": ObjectId(claims["sub"]), "active": {"$ne": False}})
    if not staff:
        raise ApiError(401, "not_authenticated", "Please log in")
    return staff


def require_role(*allowed_roles: str):
    """Dependency factory: only these staff roles may call the endpoint (checked on the server)."""

    async def checker(staff: dict = Depends(current_staff)) -> dict:
        if staff["role"] not in allowed_roles:
            raise ApiError(403, "forbidden", "You don't have access to this")
        return staff

    return checker
