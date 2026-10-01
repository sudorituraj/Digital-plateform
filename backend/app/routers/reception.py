"""Reception: the day's appointment list, status changes, reschedule and walk-ins (reception/admin only)."""

import logging
import re
from datetime import UTC, date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pymongo import ReturnDocument

from .. import clinic
from ..db import get_db, next_sequence
from ..errors import ApiError
from ..lifecycle import check_transition, history_entry, insert_appointment, next_token
from ..notifications import notify, run_due_reminders
from ..schemas import (
    OverviewOut,
    RescheduleIn,
    StaffAppointmentOut,
    StaffListOut,
    StatusChangeIn,
    WalkInIn,
)
from ..security import require_role

router = APIRouter(prefix="/staff", tags=["reception"])
log = logging.getLogger("saran.reception")
reception_only = require_role("reception", "admin")
SLOT_ORDER = {slot: i for i, slot in enumerate(clinic.TIME_SLOTS)}


# ---- helpers -------------------------------------------------------------------------------------

def current_slot() -> str:
    """The window we are in now (before 10 → first, after 4 → last)."""
    hour = clinic.now().hour
    for slot, (_, end) in clinic.SLOT_HOURS.items():
        if hour < end:
            return slot
    return clinic.TIME_SLOTS[-1]


async def find_appointment(request_id: str) -> dict:
    doc = await get_db().appointments.find_one({"request_id": request_id.strip().upper()})
    if not doc:
        raise ApiError(404, "not_found", "Appointment not found")
    return doc


async def enrich(docs: list[dict]) -> list[StaffAppointmentOut]:
    """Add patient age/gender and whether this is the patient's first visit (no earlier completed visit)."""
    db = get_db()
    ids = list({d["patient_id"] for d in docs})
    patients = {p["_id"]: p async for p in db.patients.find({"_id": {"$in": ids}}, {"age": 1, "gender": 1})}
    first_completed: dict = {}
    async for a in db.appointments.find({"patient_id": {"$in": ids}, "status": "completed"}, {"patient_id": 1, "date": 1}):
        pid = a["patient_id"]
        first_completed[pid] = min(first_completed.get(pid, a["date"]), a["date"])
    out = []
    for d in docs:
        p = patients.get(d["patient_id"], {})
        out.append(
            StaffAppointmentOut(
                request_id=d["request_id"],
                patient_code=d["patient_code"],
                patient_name=d["patient_name"],
                patient_phone=d["patient_phone"],
                patient_age=p.get("age"),
                patient_gender=p.get("gender"),
                first_visit=d["patient_id"] not in first_completed or first_completed[d["patient_id"]] >= d["date"],
                date=d["date"],
                time_slot=d["time_slot"],
                reason=d.get("reason"),
                clinic_patient_ref=d.get("clinic_patient_ref"),
                status=d["status"],
                token=d.get("token"),
                source=d.get("source", "online"),
                created_at=d["created_at"],
                updated_at=d.get("updated_at", d["created_at"]),
                history=d.get("status_history", []),
            )
        )
    return out


def queue_order(d: dict):
    # Checked-in patients first, in token order; then by part of the day; then by booking time.
    return (d.get("token") is None, d.get("token") or 0, SLOT_ORDER.get(d["time_slot"], 9), d["created_at"])


# ---- read ------------------------------------------------------------------------------------------

@router.get("/overview", response_model=OverviewOut)
async def overview(day: date | None = Query(None, alias="date"), staff: dict = Depends(reception_only)):
    db = get_db()
    await run_due_reminders(db)  # reception opens this every morning: a natural moment to send reminders
    today = clinic.today()
    day = day or today
    docs = await db.appointments.find({"date": day.isoformat()}).to_list(1000)
    counts = {s: 0 for s in clinic.ALL_STATUSES}
    for d in docs:
        counts[d["status"]] = counts.get(d["status"], 0) + 1
    counts["total"] = len(docs)
    active = [a for a in await enrich(docs) if a.status != "cancelled"]
    pending = await db.appointments.count_documents(
        {"status": "request_submitted", "date": {"$gte": today.isoformat()}}
    )
    return OverviewOut(
        date=day, today=today, counts=counts, new_patients=sum(a.first_visit for a in active), pending_requests=pending
    )


@router.get("/appointments", response_model=StaffListOut)
async def list_appointments(
    view: Literal["day", "requests"] = "day",
    day: date | None = Query(None, alias="date"),
    status: str | None = Query(None, max_length=30),
    q: str | None = Query(None, max_length=50),
    staff: dict = Depends(reception_only),
):
    """view=day: everything on one date. view=requests: all new requests from today on, oldest date first."""
    today = clinic.today()
    day = day or today
    if view == "requests":
        query: dict = {"status": "request_submitted", "date": {"$gte": today.isoformat()}}
    else:
        query = {"date": day.isoformat()}
        if status in clinic.ALL_STATUSES:
            query["status"] = status
    if q and q.strip():
        # Escape the text so a search can never be interpreted as a (slow) regular expression.
        pattern = {"$regex": re.escape(q.strip()), "$options": "i"}
        digits = re.sub(r"\D", "", q)
        query["$or"] = [
            {"patient_name": pattern},
            {"request_id": pattern},
            {"patient_code": pattern},
            *([{"patient_phone": {"$regex": re.escape(digits[-10:])}}] if len(digits) >= 3 else []),
        ]
    docs = await get_db().appointments.find(query).to_list(1000)
    docs.sort(key=(lambda d: (d["date"], SLOT_ORDER.get(d["time_slot"], 9), d["created_at"])) if view == "requests" else queue_order)
    return StaffListOut(view=view, date=day, items=await enrich(docs))


@router.get("/appointments/{request_id}", response_model=StaffAppointmentOut)
async def get_appointment(request_id: str, staff: dict = Depends(reception_only)):
    return (await enrich([await find_appointment(request_id)]))[0]


# ---- change ----------------------------------------------------------------------------------------

@router.post("/appointments/{request_id}/status", response_model=StaffAppointmentOut)
async def change_status(request_id: str, body: StatusChangeIn, staff: dict = Depends(reception_only)):
    db = get_db()
    doc = await find_appointment(request_id)
    check_transition(doc["status"], body.status)
    today = clinic.today().isoformat()
    if body.status in ("checked_in", "waiting") and doc["date"] != today:
        raise ApiError(409, "not_today", "Patients can only be checked in on the day of the appointment")
    if body.status == "completed" and doc["date"] > today:
        raise ApiError(409, "not_today", "A future appointment cannot be completed")

    changes: dict = {"status": body.status, "updated_at": datetime.now(UTC)}
    if body.status == "checked_in" and doc.get("token") is None:
        changes["token"] = await next_token(db, doc["date"])
    # The current status is part of the filter: if someone else changed it a moment ago, we don't overwrite.
    updated = await db.appointments.find_one_and_update(
        {"_id": doc["_id"], "status": doc["status"]},
        {"$set": changes, "$push": {"status_history": history_entry(body.status, staff["username"], body.note)}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise ApiError(409, "changed_elsewhere", "This appointment was just changed. Please refresh.")
    log.info("%s: %s → %s by %s", doc["request_id"], doc["status"], body.status, staff["username"])
    if body.status in ("confirmed", "cancelled"):
        await notify(db, body.status, appt=updated, by="clinic")
    return (await enrich([updated]))[0]


@router.post("/appointments/{request_id}/reschedule", response_model=StaffAppointmentOut)
async def reschedule(request_id: str, body: RescheduleIn, staff: dict = Depends(reception_only)):
    db = get_db()
    doc = await find_appointment(request_id)
    if doc["status"] not in ("request_submitted", "confirmed"):
        raise ApiError(409, "invalid_transition", "Only new or confirmed appointments can be rescheduled", current=doc["status"])
    if body.date not in clinic.bookable_dates(for_staff=True):
        raise ApiError(400, "date_unavailable", "This date cannot be booked")
    new_day = body.date.isoformat()
    if new_day == doc["date"] and body.time_slot == doc["time_slot"]:
        raise ApiError(400, "no_change", "That is the same day and time")
    clash = await db.appointments.find_one(
        {"patient_id": doc["patient_id"], "date": new_day, "status": {"$in": clinic.ACTIVE_STATUSES}, "_id": {"$ne": doc["_id"]}}
    )
    if clash:
        raise ApiError(409, "duplicate_booking", "This patient already has an appointment that day", request_id=clash["request_id"])

    note = f"{doc['date']} {doc['time_slot']} → {new_day} {body.time_slot}" + (f" · {body.note}" if body.note else "")
    updated = await db.appointments.find_one_and_update(
        {"_id": doc["_id"], "status": doc["status"]},
        {
            # The clinic chose the new time, so it is confirmed.
            "$set": {"date": new_day, "time_slot": body.time_slot, "status": "confirmed", "updated_at": datetime.now(UTC)},
            "$push": {"status_history": history_entry("rescheduled", staff["username"], note)},
        },
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise ApiError(409, "changed_elsewhere", "This appointment was just changed. Please refresh.")
    log.info("%s rescheduled (%s) by %s", doc["request_id"], note, staff["username"])
    await notify(db, "rescheduled", appt=updated)
    return (await enrich([updated]))[0]


@router.post("/walk-ins", response_model=StaffAppointmentOut, status_code=201)
async def walk_in(body: WalkInIn, staff: dict = Depends(reception_only)):
    """Patient at the desk (or on the phone): find/create the patient and add the appointment."""
    db = get_db()
    today = clinic.today()
    day = body.date or today
    if day not in clinic.bookable_dates(for_staff=True):
        raise ApiError(400, "date_unavailable", "This date cannot be booked")
    now = datetime.now(UTC)
    profile = {"name": body.name, "age": body.age, "gender": body.gender, **({"email": body.email} if body.email else {})}

    patient = await db.patients.find_one({"phone": body.phone})
    if patient:
        await db.patients.update_one({"_id": patient["_id"]}, {"$set": {**profile, "updated_at": now}})
        clash = await db.appointments.find_one(
            {"patient_id": patient["_id"], "date": day.isoformat(), "status": {"$in": clinic.ACTIVE_STATUSES}}
        )
        if clash:
            raise ApiError(409, "duplicate_booking", "This patient already has an appointment that day", request_id=clash["request_id"])
    else:
        patient = {
            "phone": body.phone,
            "patient_code": f"P{await next_sequence(db, 'patient'):06d}",
            "email": None,
            **profile,
            "source": "walk_in",
            "created_at": now,
            "updated_at": now,
        }
        patient["_id"] = (await db.patients.insert_one(patient)).inserted_id

    arriving_now = day == today
    status = "checked_in" if arriving_now else "confirmed"
    doc = {
        "patient_id": patient["_id"],
        "patient_code": patient["patient_code"],
        "patient_name": body.name,
        "patient_phone": body.phone,
        "doctor": clinic.DOCTOR,
        "date": day.isoformat(),
        "time_slot": body.time_slot or current_slot(),
        "reason": body.reason,
        "clinic_patient_ref": None,
        "status": status,
        "status_history": [history_entry(status, staff["username"], "Walk-in" if arriving_now else "Booked at reception")],
        "token": await next_token(db, day.isoformat()) if arriving_now else None,
        "source": "walk_in",
        "created_at": now,
        "updated_at": now,
    }
    await insert_appointment(db, doc)
    if not arriving_now:  # booked for another day at the desk → confirmation message
        await notify(db, "confirmed", patient=patient, appt=doc, by="clinic")
    log.info("Walk-in %s for %s on %s by %s", doc["request_id"], patient["patient_code"], day, staff["username"])
    return (await enrich([doc]))[0]
