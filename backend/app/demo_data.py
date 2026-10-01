"""
Fictional demo data for the client demo (scope §24). NEVER real patients.
Phone numbers use the obviously fake range 90000 00xxx. Everything is tagged demo=True,
so `seed-demo --reset` removes exactly this data and nothing else.
"""

from datetime import UTC, datetime, timedelta

from pymongo.asynchronous.database import AsyncDatabase

from . import clinic
from .db import next_sequence
from .lifecycle import history_entry, new_request_id

PATIENTS = [
    ("Sunita Devi", 29, "female"), ("Priya Kumari", 24, "female"), ("Rekha Singh", 35, "female"),
    ("Anjali Kumari", 27, "female"), ("Meena Devi", 42, "female"), ("Kavita Sharma", 31, "female"),
    ("Pooja Gupta", 26, "female"), ("Rinki Kumari", 22, "female"), ("Savita Devi", 48, "female"),
    ("Neha Prasad", 30, "female"), ("Guddi Devi", 38, "female"), ("Shalini Rai", 33, "female"),
    ("Ramesh Yadav", 45, "male"), ("Suman Kumari", 28, "female"), ("Asha Devi", 55, "female"),
]
# Fictional, generic notes for the demo doctor screen (not real medical records).
DEMO_NOTES = [
    "Routine check-up. BP 118/76. Advised iron and folic acid; review with reports.",
    "Follow-up visit. Reports normal. Continue current advice.",
    "Mild pain, no fever. Advised rest and plenty of fluids; come back if it continues.",
]
# follow-up (days after the visit) for completed demo visits, by plan index; None = no follow-up
DEMO_FOLLOW_UP = {0: 20, 1: 21, 2: 14, 4: 14, 5: 30}

REASONS = ["Regular check-up", "Pregnancy check-up", "Follow-up with reports", "Stomach pain", None, "Irregular periods", None]

# (patient index, day offset, slot, final status, source) — the story of a normal clinic day.
PLAN = [
    # earlier visits → these patients show as returning
    (0, -20, "morning", "completed", "online"), (2, -14, "afternoon", "completed", "walk_in"),
    (4, -7, "morning", "completed", "online"), (5, -3, "afternoon", "cancelled", "online"),
    # today
    (0, 0, "morning", "completed", "online"), (2, 0, "morning", "completed", "walk_in"),
    (1, 0, "morning", "waiting", "online"), (3, 0, "morning", "checked_in", "online"),
    (6, 0, "afternoon", "checked_in", "walk_in"), (7, 0, "afternoon", "confirmed", "online"),
    (8, 0, "midday", "confirmed", "online"), (9, 0, "afternoon", "request_submitted", "online"),
    # coming days
    (10, 1, "morning", "request_submitted", "online"), (11, 1, "afternoon", "request_submitted", "online"),
    (12, 2, "afternoon", "confirmed", "online"), (13, 3, "morning", "request_submitted", "online"),
    (14, 5, "morning", "request_submitted", "online"),
]
PATH = ["request_submitted", "confirmed", "checked_in", "waiting", "completed"]


def steps_to(status: str, source: str) -> list[str]:
    if status == "cancelled":
        return ["request_submitted", "cancelled"]
    if source == "walk_in":
        return ["checked_in", "completed"] if status == "completed" else ["checked_in"]
    return PATH[: PATH.index(status) + 1]


async def reset_demo_data(db: AsyncDatabase) -> None:
    await db.appointments.delete_many({"demo": True})
    await db.visits.delete_many({"demo": True})
    await db.notifications.delete_many({"demo": True})
    await db.patients.delete_many({"demo": True})


async def seed_demo_data(db: AsyncDatabase) -> int:
    today = clinic.today()
    patients = []
    for i, (name, age, gender) in enumerate(PATIENTS):
        phone = f"90000{i + 1:05d}"
        existing = await db.patients.find_one({"phone": phone})
        if existing:
            patients.append(existing)
            continue
        doc = {"phone": phone, "patient_code": f"P{await next_sequence(db, 'patient'):06d}", "name": name, "age": age,
               "gender": gender, "email": None, "source": "online", "demo": True,
               "created_at": datetime.now(UTC) - timedelta(days=30), "updated_at": datetime.now(UTC)}
        doc["_id"] = (await db.patients.insert_one(doc)).inserted_id
        patients.append(doc)

    tokens: dict[str, int] = {}
    created = 0
    for n, (pi, offset, slot, status, source) in enumerate(PLAN):
        p = patients[pi]
        day = (today + timedelta(days=offset)).isoformat()
        if await db.appointments.find_one({"patient_id": p["_id"], "date": day, "demo": True}):
            continue
        booked = datetime.now(UTC) + timedelta(days=min(offset, 0) - 2, minutes=n)
        steps = steps_to(status, source)
        history = []
        for k, s in enumerate(steps):
            entry = history_entry(s, "patient" if s == "request_submitted" else "reception")
            entry["at"] = booked + timedelta(hours=k)
            history.append(entry)
        token = None
        if "checked_in" in steps:
            tokens[day] = tokens.get(day, 0) + 1
            token = tokens[day]
        appt = {
            "request_id": new_request_id(), "patient_id": p["_id"], "patient_code": p["patient_code"],
            "patient_name": p["name"], "patient_phone": p["phone"], "doctor": clinic.DOCTOR, "date": day,
            "time_slot": slot, "reason": REASONS[n % len(REASONS)], "clinic_patient_ref": None, "status": status,
            "status_history": history, "token": token, "source": source, "demo": True,
            "created_at": booked, "updated_at": history[-1]["at"],
        }
        appt["_id"] = (await db.appointments.insert_one(appt)).inserted_id
        created += 1
        # The messages this appointment would have produced (simulated WhatsApp + in-app).
        sent = [("submitted", history[0]["at"])] if source == "online" else []
        if "confirmed" in steps:
            sent.append(("confirmed", history[steps.index("confirmed")]["at"]))
        if status == "cancelled":
            sent.append(("cancelled", history[-1]["at"]))
        for kind, at in sent:
            await db.notifications.insert_one({
                "patient_id": p["_id"], "appointment_id": appt["_id"], "request_id": appt["request_id"], "type": kind,
                "params": {"date": day, "time_slot": slot}, "phone": p["phone"], "patient_name": p["name"],
                "channel": "whatsapp", "delivery": "simulated", "created_at": at, "read_at": at if offset < 0 else None, "demo": True,
            })
        if status == "completed":  # every finished demo visit gets a (fictional) note
            follow = DEMO_FOLLOW_UP.get(n)
            follow_day = (today + timedelta(days=offset + follow)).isoformat() if follow else None
            await db.visits.insert_one({
                "appointment_id": appt["_id"], "patient_id": p["_id"], "request_id": appt["request_id"], "date": day,
                "doctor": clinic.DOCTOR, "notes": DEMO_NOTES[n % len(DEMO_NOTES)], "follow_up_date": follow_day,
                "status": "completed", "by": "doctor", "demo": True, "created_at": history[-1]["at"], "updated_at": history[-1]["at"],
            })
            # The latest visit sets the patient's follow-up.
            await db.patients.update_one({"_id": p["_id"]}, {"$set": {"follow_up_date": follow_day}})
    # Keep the token counters in step, so the next real check-in gets the next number.
    for day, last in tokens.items():
        await db.counters.update_one({"_id": f"token:{day}"}, {"$max": {"seq": last}}, upsert=True)
    return created
