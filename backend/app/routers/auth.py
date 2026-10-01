"""Patient login: mobile number → one-time code → session cookie. Also supports password login."""

import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Request, Response
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from .. import rate_limit
from ..config import Settings, get_settings
from ..db import get_db, next_sequence
from ..errors import ApiError
from ..schemas import (
    LoginWithPasswordIn,
    LoginWithPasswordOut,
    OtpRequestIn,
    OtpRequestOut,
    OtpVerifyIn,
    PatientOut,
    PatientRegistrationIn,
    SessionOut,
)
from ..security import (
    clear_session,
    client_ip,
    create_session,
    current_patient,
    generate_otp,
    hash_otp,
    hash_password,
    otp_matches,
    verify_password,
)
from ..serializers import patient_out

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger("saran.auth")


def mask(phone: str) -> str:
    return f"******{phone[-4:]}"


@router.post("/otp/request", response_model=OtpRequestOut)
async def request_otp(body: OtpRequestIn, request: Request, settings: Settings = Depends(get_settings)):
    db = get_db()
    now = datetime.now(UTC)

    await rate_limit.hit(db, f"otp-ip:{client_ip(request, settings)}", settings.otp_per_ip_per_hour, 3600)
    await rate_limit.hit(db, f"otp-phone:{body.phone}", settings.otp_per_phone_per_10min, 600)

    existing = await db.otp_codes.find_one({"phone": body.phone})
    if existing:
        wait = settings.otp_resend_seconds - (now - existing["created_at"]).total_seconds()
        if wait > 0:
            raise ApiError(429, "otp_resend_too_soon", "Please wait before asking for a new code", retry_after=int(wait) + 1)

    if settings.otp_mode == "sms":
        # A real SMS provider plugs in here (future phase, needs clinic approval + budget).
        raise ApiError(503, "otp_unavailable", "SMS delivery is not configured")

    code = generate_otp(settings.otp_length)
    await db.otp_codes.replace_one(
        {"phone": body.phone},
        {
            "phone": body.phone,
            "code_hash": hash_otp(body.phone, code, settings),
            "attempts": 0,
            "created_at": now,
            "expires_at": now + timedelta(seconds=settings.otp_ttl_seconds),
        },
        upsert=True,
    )
    log.info("OTP issued for %s (mode=%s)", mask(body.phone), settings.otp_mode)
    return OtpRequestOut(
        expires_in=settings.otp_ttl_seconds,
        resend_in=settings.otp_resend_seconds,
        demo_code=code if settings.otp_mode == "demo" else None,
    )


async def check_otp(db, phone: str, code: str, request: Request, settings: Settings) -> dict:
    """Raise if the code is missing, expired or wrong (counting wrong tries). Returns the OTP record."""
    await rate_limit.hit(db, f"verify-ip:{client_ip(request, settings)}", settings.otp_verify_per_ip_per_hour, 3600)
    otp = await db.otp_codes.find_one({"phone": phone})
    # MongoDB's TTL cleanup runs about once a minute, so check expiry ourselves too.
    if not otp or otp["expires_at"] <= datetime.now(UTC):
        raise ApiError(400, "otp_expired", "This code has expired. Please ask for a new one.")
    if not otp_matches(otp["code_hash"], phone, code, settings):
        otp = await db.otp_codes.find_one_and_update(
            {"_id": otp["_id"]}, {"$inc": {"attempts": 1}}, return_document=ReturnDocument.AFTER
        )
        left = settings.otp_max_attempts - (otp["attempts"] if otp else settings.otp_max_attempts)
        if left <= 0:
            await db.otp_codes.delete_one({"phone": phone})
            raise ApiError(429, "otp_too_many_attempts", "Too many wrong codes. Please ask for a new one.")
        raise ApiError(400, "otp_invalid", "Wrong code", attempts_left=left)
    return otp


@router.post("/otp/verify", response_model=PatientOut)
async def verify_otp(
    body: OtpVerifyIn, request: Request, response: Response, settings: Settings = Depends(get_settings)
):
    """Log in an existing patient. For a new number the client is told to register — but only after the
    correct code proves they own the number (so nobody can probe which numbers are patients)."""
    db = get_db()
    otp = await check_otp(db, body.phone, body.code, request, settings)
    patient = await db.patients.find_one({"phone": body.phone})
    if not patient:
        # Keep the code: the registration step sends it again together with the patient's details.
        raise ApiError(409, "registration_required", "New patient — please fill in your details")
    await db.otp_codes.delete_one({"_id": otp["_id"]})  # a code works only once
    create_session(response, str(patient["_id"]), "patient", settings)
    log.info("Patient %s logged in via OTP", patient["patient_code"])
    return patient_out(patient)


@router.post("/otp/verify/register", response_model=PatientOut)
async def verify_otp_and_register(
    body: PatientRegistrationIn, request: Request, response: Response, settings: Settings = Depends(get_settings)
):
    """Verify the code and create the patient record with their details."""
    db = get_db()
    otp = await check_otp(db, body.phone, body.code, request, settings)
    await db.otp_codes.delete_one({"_id": otp["_id"]})
    patient = await get_or_create_patient(body.phone, datetime.now(UTC), body)
    create_session(response, str(patient["_id"]), "patient", settings)
    log.info("Patient %s registered via OTP", patient["patient_code"])
    return patient_out(patient)


# Checked even when the number has no password, so response time doesn't reveal which numbers exist.
_DUMMY_HASH = hash_password("not-a-real-password")
PASSWORD_MAX_FAILS = 5  # wrong passwords per number…
PASSWORD_LOCK_SECONDS = 900  # …within 15 minutes locks password login for that number


@router.post("/login/password", response_model=LoginWithPasswordOut)
async def login_with_password(
    body: LoginWithPasswordIn, request: Request, response: Response, settings: Settings = Depends(get_settings)
):
    db = get_db()
    await rate_limit.hit(db, f"pwd-ip:{client_ip(request, settings)}", 30, 3600)
    fail_key = f"pwd-fail:{body.phone}"
    if await rate_limit.count(db, fail_key, PASSWORD_LOCK_SECONDS) >= PASSWORD_MAX_FAILS:
        raise ApiError(429, "password_locked", "Too many wrong passwords. Use a one-time code or try later.")

    patient = await db.patients.find_one({"phone": body.phone})
    stored = (patient or {}).get("password_hash") or _DUMMY_HASH
    if not patient or not patient.get("password_hash") or not verify_password(body.password, stored):
        # Same answer whether the number is unknown, has no password, or the password is wrong.
        await rate_limit.record(db, fail_key, PASSWORD_LOCK_SECONDS)
        raise ApiError(401, "wrong_login", "Mobile number or password is wrong")

    create_session(response, str(patient["_id"]), "patient", settings)
    log.info("Patient %s logged in via password", patient["patient_code"])
    return LoginWithPasswordOut(patient=patient_out(patient))


@router.post("/password/set", response_model=PatientOut)
async def set_password(body: LoginWithPasswordIn, patient: dict = Depends(current_patient)):
    """Set or update password for the logged-in patient."""
    db = get_db()
    await db.patients.update_one(
        {"_id": patient["_id"]},
        {"$set": {"password_hash": hash_password(body.password), "updated_at": datetime.now(UTC)}}
    )
    patient = await db.patients.find_one({"_id": patient["_id"]})
    return patient_out(patient)


async def get_or_create_patient(phone: str, now: datetime, registration: PatientRegistrationIn | None = None) -> dict:
    db = get_db()
    patient = await db.patients.find_one({"phone": phone})
    if patient:
        return patient
    if registration:
        # Create patient with full registration data
        doc = {
            "phone": registration.phone,
            "patient_code": f"P{await next_sequence(db, 'patient'):06d}",
            "name": registration.name,
            "father_husband_name": registration.father_husband_name,
            "email": registration.email,
            "gender": registration.gender,
            "age": registration.age,
            "address": registration.address,
            "source": "online",
            "created_at": now,
            "updated_at": now,
        }
    else:
        # Create minimal patient (will be completed later)
        doc = {
            "phone": phone,
            "patient_code": f"P{await next_sequence(db, 'patient'):06d}",
            "name": None,
            "father_husband_name": None,
            "email": None,
            "gender": None,
            "age": None,
            "address": None,
            "source": "online",
            "created_at": now,
            "updated_at": now,
        }
    try:
        result = await db.patients.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc
    except DuplicateKeyError:
        return await db.patients.find_one({"phone": phone})


@router.get("/session", response_model=SessionOut)
async def session(request: Request, settings: Settings = Depends(get_settings)):
    """Who is logged in? Always 200 (patient or null), so guests don't trigger error responses."""
    try:
        patient = await current_patient(request, settings)
    except ApiError:
        return SessionOut(patient=None)
    return SessionOut(patient=patient_out(patient))


@router.post("/logout", status_code=204)
async def logout(response: Response, settings: Settings = Depends(get_settings)):
    clear_session(response, settings)
