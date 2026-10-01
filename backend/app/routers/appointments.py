"""Booking options, creating appointment requests and the patient's own appointment list."""

import logging
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, Query
from pymongo import ReturnDocument

from .. import clinic
from ..db import get_db
from ..errors import ApiError
from ..lifecycle import history_entry, insert_appointment
from ..notifications import notify
from .. import payments
from ..schemas import AppointmentIn, AppointmentOut, BookingOptionsOut, MyAppointmentsOut, PayIn, QuoteOut
from ..security import current_patient
from ..serializers import appointment_out

router = APIRouter(tags=["appointments"])
log = logging.getLogger("saran.appointments")

@router.get("/booking/options", response_model=BookingOptionsOut)
async def booking_options(staff: bool = False):
    """Days and time windows to offer. `staff=true` gives the longer reception window (dates aren't secret;
    the staff endpoints check the window again)."""
    return BookingOptionsOut(
        doctor=clinic.DOCTOR,
        time_slots=clinic.TIME_SLOTS,
        dates=clinic.bookable_dates(for_staff=staff),
        today=clinic.today(),
        open_today=clinic.open_slots(clinic.today()),
        hours={"open": clinic.OPENING_HOUR, "close": clinic.CLOSING_HOUR},
        window_days=clinic.STAFF_WINDOW_DAYS if staff else clinic.PATIENT_WINDOW_DAYS,
    )


@router.post("/appointments", response_model=AppointmentOut, status_code=201)
async def create_appointment(body: AppointmentIn, patient: dict = Depends(current_patient)):
    db = get_db()
    if body.date not in clinic.bookable_dates():
        raise ApiError(400, "date_unavailable", "This date cannot be booked")
    if body.time_slot not in clinic.open_slots(body.date):
        raise ApiError(400, "slot_passed", "This time has already passed today")

    day = body.date.isoformat()
    active = {"patient_id": patient["_id"], "status": {"$in": clinic.ACTIVE_STATUSES}}
    if await db.appointments.find_one({**active, "date": day}):
        raise ApiError(409, "duplicate_booking", "You already have an appointment request for this day")
    upcoming = await db.appointments.count_documents({**active, "date": {"$gte": clinic.today().isoformat()}})
    if upcoming >= clinic.MAX_ACTIVE_REQUESTS:
        raise ApiError(409, "too_many_active", "Too many open appointment requests")

    now = datetime.now(UTC)
    profile = body.model_dump(include={"name", "age", "gender", "email"})
    await db.patients.update_one({"_id": patient["_id"]}, {"$set": {**profile, "updated_at": now}})

    doc = {
        "patient_id": patient["_id"],
        "patient_code": patient["patient_code"],
        "patient_name": body.name,
        "patient_phone": patient["phone"],
        "doctor": clinic.DOCTOR,
        "date": day,  # stored as YYYY-MM-DD in clinic local time
        "time_slot": body.time_slot,
        "reason": body.reason,
        "clinic_patient_ref": body.clinic_patient_ref,
        "status": "request_submitted",
        "status_history": [history_entry("request_submitted", "patient")],
        "token": None,  # queue number, given by reception at check-in
        # Fee decided by the server from the 14-day follow-up rule (never trusted from the browser).
        "payment": payments.new_payment(await payments.quote(db, patient["_id"], body.date)),
        "source": "online",
        "created_at": now,
        "updated_at": now,
    }
    await insert_appointment(db, doc)
    await notify(db, "submitted", patient=patient, appt=doc)

    log.info("Appointment %s requested by %s for %s %s", doc["request_id"], patient["patient_code"], day, body.time_slot)
    return appointment_out(doc)


@router.get("/booking/quote", response_model=QuoteOut)
async def booking_quote(day: date = Query(alias="date"), patient: dict = Depends(current_patient)):
    """Fee for this patient on this day: free if their last visit was within 14 days."""
    q = await payments.quote(get_db(), patient["_id"], day)
    return QuoteOut(**q, free_days=payments.FREE_FOLLOWUP_DAYS)


@router.post("/appointments/{request_id}/pay", response_model=AppointmentOut)
async def pay(request_id: str, body: PayIn, patient: dict = Depends(current_patient)):
    """DEMO checkout — simulated, no money moves (see app/payments.py)."""
    db = get_db()
    doc = await db.appointments.find_one({"request_id": request_id.upper(), "patient_id": patient["_id"]})
    if not doc:
        raise ApiError(404, "not_found", "Appointment not found")
    pay_info = doc.get("payment") or {}
    if pay_info.get("status") != "pending" or doc["status"] in ("completed", "cancelled"):
        raise ApiError(409, "nothing_to_pay", "There is nothing to pay for this appointment")
    needed = {"upi": "upi_id", "card": "card_last4", "netbanking": "bank"}[body.method]
    if not getattr(body, needed):
        raise ApiError(422, "validation_error", "Missing payment details", fields=[needed])
    details = body.model_dump(exclude={"method"}, exclude_none=True)
    payments.charge(body.method, details)
    result = payments.paid(body.method, "patient", **details)
    updated = await db.appointments.find_one_and_update(
        {"_id": doc["_id"], "payment.status": "pending"},  # paying twice at the same moment can't double-charge
        {"$set": {**{f"payment.{k}": v for k, v in result.items()}, "updated_at": datetime.now(UTC)}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise ApiError(409, "nothing_to_pay", "There is nothing to pay for this appointment")
    await notify(db, "paid", patient=patient, appt=updated, amount=str(updated["payment"]["amount"]),
                 reference=result["reference"])
    log.info("DEMO payment %s for %s via %s", result["reference"], doc["request_id"], body.method)
    return appointment_out(updated)


@router.get("/appointments/mine", response_model=MyAppointmentsOut)
async def my_appointments(patient: dict = Depends(current_patient)):
    today = clinic.today().isoformat()
    docs = await get_db().appointments.find({"patient_id": patient["_id"]}).sort("date", 1).to_list(200)
    upcoming = [d for d in docs if d["date"] >= today and d["status"] in clinic.ACTIVE_STATUSES]
    previous = [d for d in reversed(docs) if d not in upcoming]
    return MyAppointmentsOut(
        upcoming=[appointment_out(d) for d in upcoming], previous=[appointment_out(d) for d in previous]
    )


@router.get("/appointments/{request_id}", response_model=AppointmentOut)
async def get_appointment(request_id: str, patient: dict = Depends(current_patient)):
    # Scoped to the patient: someone else's ID looks exactly like a missing one (no leaking).
    doc = await get_db().appointments.find_one({"request_id": request_id.upper(), "patient_id": patient["_id"]})
    if not doc:
        raise ApiError(404, "not_found", "Appointment not found")
    return appointment_out(doc)


@router.post("/appointments/{request_id}/cancel", response_model=AppointmentOut)
async def cancel_appointment(request_id: str, patient: dict = Depends(current_patient)):
    """Patient can cancel their own request_submitted appointment."""
    db = get_db()
    now = datetime.now(UTC)
    doc = await db.appointments.find_one({"request_id": request_id.upper(), "patient_id": patient["_id"]})
    if not doc:
        raise ApiError(404, "not_found", "Appointment not found")
    # The status condition is part of the update itself, so a request that reception confirms at the
    # same moment can't be cancelled by mistake.
    result = await db.appointments.update_one(
        {"_id": doc["_id"], "status": "request_submitted"},
        {
            "$set": {
                "status": "cancelled",
                "updated_at": now,
            },
            "$push": {"status_history": history_entry("cancelled", "patient")},
        },
    )
    if result.modified_count == 0:
        raise ApiError(400, "cannot_cancel", "Only requested appointments can be cancelled online. Please call the clinic.")
    doc["status"] = "cancelled"
    doc["updated_at"] = now
    doc = await payments_refund_if_paid(db, doc)
    await notify(db, "cancelled", patient=patient, appt=doc, by="patient")
    log.info("Appointment %s cancelled by patient %s", request_id, patient["patient_code"])
    return appointment_out(doc)


async def payments_refund_if_paid(db, doc: dict) -> dict:
    """Cancelled after paying → DEMO refund (recorded only; a real gateway would refund here)."""
    if (doc.get("payment") or {}).get("status") == "paid":
        await db.appointments.update_one({"_id": doc["_id"]}, {"$set": {"payment.status": "refunded"}})
        doc = {**doc, "payment": {**doc["payment"], "status": "refunded"}}
    return doc
