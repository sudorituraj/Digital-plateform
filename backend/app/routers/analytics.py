"""Simple management numbers (scope §12) — deliberately not a BI tool."""

from collections import Counter
from datetime import timedelta

from fastapi import APIRouter, Depends, Query

from .. import clinic
from ..db import get_db
from ..errors import ApiError
from ..schemas import AnalyticsOut, DayCountOut
from ..security import require_role

router = APIRouter(prefix="/staff", tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsOut)
async def analytics(
    days: int = Query(30),
    staff: dict = Depends(require_role("reception", "admin", "doctor")),
):
    """Appointments dated in the last `days` days (including today).
    New patient = their first-ever (non-cancelled) appointment falls in the period; returning = came before."""
    if days not in (7, 30, 90):
        raise ApiError(422, "validation_error", "days must be 7, 30 or 90", fields=["days"])
    db = get_db()
    end = clinic.today()
    start = end - timedelta(days=days - 1)
    period = {"date": {"$gte": start.isoformat(), "$lte": end.isoformat()}}
    appts = await db.appointments.find(period, {"patient_id": 1, "date": 1, "status": 1, "source": 1, "time_slot": 1}).to_list(20000)

    statuses = Counter(a["status"] for a in appts)
    kept = [a for a in appts if a["status"] != "cancelled"]
    patient_ids = list({a["patient_id"] for a in kept})
    first_ever = {
        row["_id"]: row["first"]
        async for row in await db.appointments.aggregate([
            {"$match": {"patient_id": {"$in": patient_ids}, "status": {"$ne": "cancelled"}}},
            {"$group": {"_id": "$patient_id", "first": {"$min": "$date"}}},
        ])
    }
    new_patients = sum(1 for pid in patient_ids if first_ever.get(pid, "") >= start.isoformat())

    by_day = {(start + timedelta(days=i)).isoformat(): Counter() for i in range(days)}
    for a in appts:
        c = by_day[a["date"]]
        c["cancelled" if a["status"] == "cancelled" else "booked"] += 1
        if a["status"] == "completed":
            c["completed"] += 1

    pending = await db.appointments.count_documents({"status": "request_submitted", "date": {"$gte": end.isoformat()}})
    return AnalyticsOut(
        days=days,
        start=start,
        end=end,
        totals={
            "appointments": len(kept),
            "completed": statuses["completed"],
            "cancelled": statuses["cancelled"],
            "pending": pending,
            "new_patients": new_patients,
            "returning_patients": len(patient_ids) - new_patients,
        },
        statuses={s: statuses[s] for s in clinic.ALL_STATUSES},
        by_day=[DayCountOut(date=d, booked=c["booked"], completed=c["completed"], cancelled=c["cancelled"]) for d, c in by_day.items()],
        sources=dict(Counter(a.get("source", "online") for a in kept)),
        slots={s: sum(1 for a in kept if a["time_slot"] == s) for s in clinic.TIME_SLOTS},
    )
