"""Doctor: today's queue, the patient's visit screen, consultation notes, follow-up, complete visit.

Reception/admin may VIEW the queue and the visit screen (notes read-only, finished notes only);
only the doctor can write notes or complete a visit.
"""

import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from pymongo import ReturnDocument

from .. import clinic
from ..db import get_db
from ..errors import ApiError
from ..lifecycle import check_transition, history_entry
from ..schemas import DoctorTodayOut, DoctorVisitOut, VisitIn
from ..security import require_role
from .patients import summarise, visit_out
from .reception import enrich, find_appointment, queue_order

router = APIRouter(prefix="/doctor", tags=["doctor"])
log = logging.getLogger("saran.doctor")
doctor_only = require_role("doctor")  # writing notes / completing visits
any_staff = require_role("doctor", "reception", "admin")  # viewing (client request 2026-10-02)
SLOT_ORDER = {slot: i for i, slot in enumerate(clinic.TIME_SLOTS)}


@router.get("/today", response_model=DoctorTodayOut)
async def today(staff: dict = Depends(any_staff)):
    day = clinic.today()
    docs = await get_db().appointments.find({"date": day.isoformat(), "status": {"$ne": "cancelled"}}).to_list(1000)
    docs.sort(key=queue_order)
    items = await enrich(docs)
    queue = [a for a in items if a.status in ("checked_in", "waiting")]
    later = sorted(
        (a for a in items if a.status in ("request_submitted", "confirmed")), key=lambda a: SLOT_ORDER.get(a.time_slot, 9)
    )
    completed = sorted((a for a in items if a.status == "completed"), key=lambda a: a.updated_at, reverse=True)
    return DoctorTodayOut(
        date=day,
        queue=queue,
        later=later,
        completed=completed,
        counts={"queue": len(queue), "waiting": sum(a.status == "waiting" for a in queue), "later": len(later), "completed": len(completed)},
    )


@router.get("/appointments/{request_id}", response_model=DoctorVisitOut)
async def visit_screen(request_id: str, staff: dict = Depends(any_staff)):
    db = get_db()
    appt = await find_appointment(request_id)
    patient = await db.patients.find_one({"_id": appt["patient_id"]})
    visit = await db.visits.find_one({"appointment_id": appt["_id"]})
    if visit and visit["status"] == "draft" and staff["role"] != "doctor":
        visit = None  # an unfinished note stays with the doctor until the visit is completed
    previous = await db.visits.find(
        {"patient_id": appt["patient_id"], "status": "completed", "appointment_id": {"$ne": appt["_id"]}}
    ).sort("date", -1).to_list(200)
    history = await db.appointments.find({"patient_id": appt["patient_id"]}).sort([("date", -1), ("created_at", -1)]).to_list(500)
    return DoctorVisitOut(
        appointment=(await enrich([appt]))[0],
        patient=(await summarise([patient]))[0],
        visit=visit_out(visit, True) if visit else None,
        previous_visits=[visit_out(v, True) for v in previous],
        appointments=await enrich(history),
    )


def check_follow_up(body: VisitIn, appt: dict) -> None:
    if body.follow_up_date is None:
        return
    visit_day = datetime.fromisoformat(appt["date"]).date()
    if not visit_day < body.follow_up_date <= visit_day + timedelta(days=366):
        raise ApiError(400, "follow_up_invalid", "Follow-up must be after the visit and within a year")


async def save_visit(appt: dict, body: VisitIn, staff: dict, status: str) -> dict:
    now = datetime.now(UTC)
    notes = (body.notes or "").strip() or None
    return await get_db().visits.find_one_and_update(
        {"appointment_id": appt["_id"]},
        {
            "$set": {"notes": notes, "follow_up_date": body.follow_up_date.isoformat() if body.follow_up_date else None,
                     "status": status, "by": staff["username"], "updated_at": now},
            "$setOnInsert": {"patient_id": appt["patient_id"], "request_id": appt["request_id"], "date": appt["date"],
                             "doctor": clinic.DOCTOR, "created_at": now},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )


@router.put("/appointments/{request_id}/visit", response_model=DoctorVisitOut)
async def save_draft(request_id: str, body: VisitIn, staff: dict = Depends(doctor_only)):
    """Save notes while the patient is with the doctor (not finished yet)."""
    appt = await find_appointment(request_id)
    if appt["status"] not in ("checked_in", "waiting"):
        raise ApiError(409, "visit_not_open", "Notes can be written once the patient has checked in")
    check_follow_up(body, appt)
    await save_visit(appt, body, staff, "draft")
    return await visit_screen(request_id, staff)


@router.post("/appointments/{request_id}/complete", response_model=DoctorVisitOut)
async def complete_visit(request_id: str, body: VisitIn, staff: dict = Depends(doctor_only)):
    db = get_db()
    appt = await find_appointment(request_id)
    check_transition(appt["status"], "completed")
    if appt["date"] > clinic.today().isoformat():
        raise ApiError(409, "not_today", "A future appointment cannot be completed")
    check_follow_up(body, appt)
    updated = await db.appointments.find_one_and_update(
        {"_id": appt["_id"], "status": appt["status"]},
        {"$set": {"status": "completed", "updated_at": datetime.now(UTC)},
         "$push": {"status_history": history_entry("completed", staff["username"])}},
    )
    if not updated:
        raise ApiError(409, "changed_elsewhere", "This appointment was just changed. Please refresh.")
    await save_visit(appt, body, staff, "completed")
    # The latest visit decides the patient's follow-up (none given = no follow-up needed).
    await db.patients.update_one(
        {"_id": appt["patient_id"]},
        {"$set": {"follow_up_date": body.follow_up_date.isoformat() if body.follow_up_date else None,
                  "updated_at": datetime.now(UTC)}},
    )
    log.info("Visit %s completed by %s (follow-up %s)", appt["request_id"], staff["username"], body.follow_up_date)
    return await visit_screen(request_id, staff)
