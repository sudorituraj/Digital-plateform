"""Patient management for clinic staff: list/search, add, profile, edit, front-desk notes."""

import logging
import re
from datetime import UTC, date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pymongo.errors import DuplicateKeyError

from .. import clinic
from ..db import get_db, next_sequence
from ..errors import ApiError
from ..schemas import (
    NextAppointmentOut,
    PatientDetailsIn,
    PatientListOut,
    PatientProfileOut,
    StaffNoteIn,
    StaffPatientOut,
    VisitOut,
)
from ..security import require_role
from .reception import enrich

router = APIRouter(prefix="/staff/patients", tags=["patients"])
log = logging.getLogger("saran.patients")
front_desk = require_role("reception", "admin")
any_staff = require_role("reception", "admin", "doctor")
SLOT_ORDER = {slot: i for i, slot in enumerate(clinic.TIME_SLOTS)}
PAGE_SIZE = 30


async def summarise(patients: list[dict]) -> list[StaffPatientOut]:
    """Add last visit, number of visits and the next appointment to each patient."""
    ids = [p["_id"] for p in patients]
    today = clinic.today().isoformat()
    stats: dict = {pid: {"last": None, "count": 0, "next": None} for pid in ids}
    async for a in get_db().appointments.find(
        {"patient_id": {"$in": ids}}, {"patient_id": 1, "date": 1, "status": 1, "time_slot": 1, "request_id": 1}
    ):
        s = stats[a["patient_id"]]
        if a["status"] == "completed":
            s["count"] += 1
            s["last"] = max(s["last"] or a["date"], a["date"])
        elif a["status"] in clinic.ACTIVE_STATUSES and a["date"] >= today:
            key = (a["date"], SLOT_ORDER.get(a["time_slot"], 9))
            if s["next"] is None or key < (s["next"]["date"], SLOT_ORDER.get(s["next"]["time_slot"], 9)):
                s["next"] = a
    out = []
    for p in patients:
        s = stats[p["_id"]]
        nxt = s["next"]
        out.append(
            StaffPatientOut(
                **{k: p.get(k) for k in ("patient_code", "name", "phone", "age", "gender", "email", "father_husband_name", "address")},
                source=p.get("source", "online"),
                created_at=p["created_at"],
                follow_up_date=p.get("follow_up_date"),
                last_visit=s["last"],
                visits_count=s["count"],
                next_appointment=NextAppointmentOut(**{k: nxt[k] for k in ("request_id", "date", "time_slot", "status")}) if nxt else None,
                notes=p.get("staff_notes", []),
            )
        )
    return out


async def find_patient(code: str) -> dict:
    patient = await get_db().patients.find_one({"patient_code": code.strip().upper()})
    if not patient:
        raise ApiError(404, "not_found", "Patient not found")
    return patient


def visit_out(v: dict, with_notes: bool) -> VisitOut:
    return VisitOut(
        request_id=v["request_id"],
        date=v["date"],
        follow_up_date=v.get("follow_up_date"),
        status=v["status"],
        notes=v.get("notes") if with_notes else None,
        by=v.get("by"),
        updated_at=v["updated_at"],
    )


@router.get("", response_model=PatientListOut)
async def list_patients(
    q: str | None = Query(None, max_length=50),
    show: Literal["all", "upcoming", "follow_up", "new"] = "all",
    offset: int = Query(0, ge=0),
    staff: dict = Depends(front_desk),
):
    """show=upcoming: has an open appointment · follow_up: follow-up due within a week (or recently missed)
    · new: registered in the last 30 days."""
    db = get_db()
    today = clinic.today()
    query: dict = {}
    if q and q.strip():
        pattern = {"$regex": re.escape(q.strip()), "$options": "i"}
        digits = re.sub(r"\D", "", q)
        query["$or"] = [
            {"name": pattern},
            {"patient_code": pattern},
            *([{"phone": {"$regex": re.escape(digits[-10:])}}] if len(digits) >= 3 else []),
        ]
    if show == "upcoming":
        ids = await db.appointments.distinct(
            "patient_id", {"status": {"$in": clinic.ACTIVE_STATUSES}, "date": {"$gte": today.isoformat()}}
        )
        query["_id"] = {"$in": ids}
    elif show == "follow_up":
        query["follow_up_date"] = {"$gte": (today - timedelta(days=30)).isoformat(), "$lte": (today + timedelta(days=7)).isoformat()}
    elif show == "new":
        query["created_at"] = {"$gte": datetime.now(UTC) - timedelta(days=30)}

    total = await db.patients.count_documents(query)
    sort = [("follow_up_date", 1)] if show == "follow_up" else [("updated_at", -1)]
    docs = await db.patients.find(query).sort(sort).skip(offset).limit(PAGE_SIZE).to_list(PAGE_SIZE)
    return PatientListOut(items=await summarise(docs), total=total, has_more=offset + len(docs) < total)


@router.post("", response_model=StaffPatientOut, status_code=201)
async def add_patient(body: PatientDetailsIn, staff: dict = Depends(front_desk)):
    db = get_db()
    existing = await db.patients.find_one({"phone": body.phone})
    if existing:
        raise ApiError(409, "patient_exists", "A patient with this mobile number exists", patient_code=existing["patient_code"])
    now = datetime.now(UTC)
    doc = {
        **body.model_dump(),
        "patient_code": f"P{await next_sequence(db, 'patient'):06d}",
        "source": "reception",
        "created_at": now,
        "updated_at": now,
    }
    try:
        doc["_id"] = (await db.patients.insert_one(doc)).inserted_id
    except DuplicateKeyError:  # same number added at the same moment
        raise ApiError(409, "patient_exists", "A patient with this mobile number exists") from None
    log.info("Patient %s added by %s", doc["patient_code"], staff["username"])
    return (await summarise([doc]))[0]


@router.get("/{code}", response_model=PatientProfileOut)
async def profile(code: str, staff: dict = Depends(any_staff)):
    db = get_db()
    patient = await find_patient(code)
    appointments = await db.appointments.find({"patient_id": patient["_id"]}).sort([("date", -1), ("created_at", -1)]).to_list(500)
    visits = await db.visits.find({"patient_id": patient["_id"], "status": "completed"}).sort("date", -1).to_list(500)
    # Consultation notes are for the doctor only; reception sees dates and follow-ups.
    with_notes = staff["role"] == "doctor"
    return PatientProfileOut(
        patient=(await summarise([patient]))[0],
        appointments=await enrich(appointments),
        visits=[visit_out(v, with_notes) for v in visits],
    )


@router.put("/{code}", response_model=StaffPatientOut)
async def update_patient(code: str, body: PatientDetailsIn, staff: dict = Depends(front_desk)):
    db = get_db()
    patient = await find_patient(code)
    if body.phone != patient["phone"]:
        other = await db.patients.find_one({"phone": body.phone})
        if other:
            raise ApiError(409, "patient_exists", "Another patient has this mobile number", patient_code=other["patient_code"])
    changes = {**body.model_dump(), "updated_at": datetime.now(UTC)}
    await db.patients.update_one({"_id": patient["_id"]}, {"$set": changes})
    # Keep the name/phone shown on open appointments in step with the record.
    await db.appointments.update_many(
        {"patient_id": patient["_id"], "status": {"$in": clinic.ACTIVE_STATUSES}},
        {"$set": {"patient_name": body.name, "patient_phone": body.phone}},
    )
    log.info("Patient %s updated by %s", patient["patient_code"], staff["username"])
    return (await summarise([{**patient, **changes}]))[0]


@router.post("/{code}/notes", response_model=StaffPatientOut)
async def add_note(code: str, body: StaffNoteIn, staff: dict = Depends(front_desk)):
    """Short front-desk notes (e.g. "prefers Hindi"). Not for medical information."""
    db = get_db()
    patient = await find_patient(code)
    note = {"text": body.text.strip(), "by": staff["username"], "at": datetime.now(UTC)}
    await db.patients.update_one({"_id": patient["_id"]}, {"$push": {"staff_notes": {"$each": [note], "$position": 0}}})
    return (await summarise([await find_patient(code)]))[0]


