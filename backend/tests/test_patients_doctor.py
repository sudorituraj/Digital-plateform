"""Stage 2.2 (patient management) and 2.3 (doctor dashboard & visit workflow)."""

from pymongo import MongoClient

from .conftest import login
from .test_reception import day, patient_books, set_status, staff_login

NEW = {"phone": "9811112222", "name": "Rekha Devi", "age": 41, "gender": "female", "father_husband_name": "Mohan", "address": "Chapra"}


def raw_db():
    return MongoClient("mongodb://localhost:27017")["saran_test"]


def checked_in(client, phone="9876543210"):
    """Patient books today, reception checks them in. Leaves the client logged in as reception."""
    rid = patient_books(client, phone)
    staff_login(client)
    set_status(client, rid, "checked_in")
    return rid


def as_doctor(client):
    client.post("/api/staff/logout")
    staff_login(client, "doctor", "doctor123")
    return client


def complete(client, rid, notes="BP normal. Iron tablets.", follow=7):
    body = {"notes": notes, "follow_up_date": day(follow) if follow is not None else None}
    return client.post(f"/api/doctor/appointments/{rid}/complete", json=body)


# ---- Stage 2.2: patients ------------------------------------------------------------------------------

def test_add_patient_and_duplicate_phone(client):
    staff_login(client)
    r = client.post("/api/staff/patients", json=NEW)
    assert r.status_code == 201 and r.json()["patient_code"].startswith("P") and r.json()["source"] == "reception"
    r = client.post("/api/staff/patients", json={**NEW, "name": "Someone Else"})
    assert r.status_code == 409 and r.json()["error"]["patient_code"]


def test_patient_added_at_reception_can_log_in_online(client):
    staff_login(client)
    code = client.post("/api/staff/patients", json=NEW).json()["patient_code"]
    client.post("/api/staff/logout")
    assert login(client, "9811112222")["patient_code"] == code  # same record, no second registration


def test_list_search_and_filters(client):
    patient_books(client, "9876543210", offset=2)  # upcoming
    staff_login(client)
    client.post("/api/staff/patients", json=NEW)
    everyone = client.get("/api/staff/patients").json()
    assert everyone["total"] == 2 and not everyone["has_more"]
    assert [p["name"] for p in client.get("/api/staff/patients", params={"q": "rekha"}).json()["items"]] == ["Rekha Devi"]
    assert client.get("/api/staff/patients", params={"q": "43210"}).json()["total"] == 1
    assert client.get("/api/staff/patients", params={"q": ".*"}).json()["total"] == 0  # regex-safe
    upcoming = client.get("/api/staff/patients", params={"show": "upcoming"}).json()["items"]
    assert [p["phone"] for p in upcoming] == ["9876543210"]
    assert upcoming[0]["next_appointment"]["date"] == day(2)
    assert client.get("/api/staff/patients", params={"show": "new"}).json()["total"] == 2


def test_profile_shows_appointments_and_booking_links_to_patient(client):
    rid = patient_books(client)
    staff_login(client)
    code = raw_db().patients.find_one()["patient_code"]
    prof = client.get(f"/api/staff/patients/{code}").json()
    assert prof["patient"]["name"] == "Sunita Devi"
    assert [a["request_id"] for a in prof["appointments"]] == [rid]


def test_edit_patient_updates_open_appointments(client):
    rid = patient_books(client, offset=1)
    staff_login(client)
    code = raw_db().patients.find_one()["patient_code"]
    r = client.put(f"/api/staff/patients/{code}", json={**NEW, "phone": "9876543210", "name": "Sunita Kumari"})
    assert r.status_code == 200 and r.json()["name"] == "Sunita Kumari"
    assert client.get(f"/api/staff/appointments/{rid}").json()["patient_name"] == "Sunita Kumari"


def test_edit_phone_cannot_take_another_patients_number(client):
    patient_books(client, "9876543210")
    staff_login(client)
    client.post("/api/staff/patients", json=NEW)
    code = raw_db().patients.find_one({"phone": "9876543210"})["patient_code"]
    r = client.put(f"/api/staff/patients/{code}", json={**NEW, "phone": "9811112222"})
    assert r.status_code == 409


def test_front_desk_notes(client):
    staff_login(client)
    code = client.post("/api/staff/patients", json=NEW).json()["patient_code"]
    client.post(f"/api/staff/patients/{code}/notes", json={"text": "Prefers Hindi"})
    notes = client.post(f"/api/staff/patients/{code}/notes", json={"text": "Comes with daughter"}).json()["notes"]
    assert [n["text"] for n in notes] == ["Comes with daughter", "Prefers Hindi"] and notes[0]["by"] == "reception"
    assert client.post(f"/api/staff/patients/{code}/notes", json={"text": ""}).status_code == 422


def test_patient_endpoints_access(client):
    assert client.get("/api/staff/patients").status_code == 401
    login(client)
    assert client.get("/api/staff/patients").status_code == 401  # patient session isn't staff
    staff_login(client, "doctor", "doctor123")
    assert client.get("/api/staff/patients").status_code == 403  # list/add/edit is front desk
    assert client.post("/api/staff/patients", json=NEW).status_code == 403


# ---- Stage 2.3: doctor ---------------------------------------------------------------------------------

def test_doctor_today_queue(client):
    rid1 = checked_in(client, "9876543210")
    rid2 = checked_in(client, "9123456789")
    patient_books(client, "9000000001", slot="afternoon")  # booked, not arrived
    staff_login(client)
    set_status(client, rid2, "waiting")
    as_doctor(client)
    t = client.get("/api/doctor/today").json()
    assert [a["request_id"] for a in t["queue"]] == [rid1, rid2]  # token order
    assert [a["token"] for a in t["queue"]] == [1, 2]
    assert t["counts"] == {"queue": 2, "waiting": 1, "later": 1, "completed": 0}


def test_reception_can_view_doctor_screens_but_not_write(client):
    rid = checked_in(client)
    for path in ["/api/doctor/today", f"/api/doctor/appointments/{rid}"]:
        assert client.get(path).status_code == 200  # reception
    body = {"notes": "x", "follow_up_date": None}
    assert client.put(f"/api/doctor/appointments/{rid}/visit", json=body).status_code == 403
    assert client.post(f"/api/doctor/appointments/{rid}/complete", json=body).status_code == 403


def test_reception_does_not_see_unfinished_draft(client):
    rid = checked_in(client)
    as_doctor(client)
    client.put(f"/api/doctor/appointments/{rid}/visit", json={"notes": "Half-written", "follow_up_date": None})
    client.post("/api/staff/logout")
    staff_login(client)
    assert client.get(f"/api/doctor/appointments/{rid}").json()["visit"] is None


def test_full_visit_draft_then_complete(client):
    rid = checked_in(client)
    as_doctor(client)
    screen = client.get(f"/api/doctor/appointments/{rid}").json()
    assert screen["visit"] is None and screen["patient"]["name"] == "Sunita Devi"
    r = client.put(f"/api/doctor/appointments/{rid}/visit", json={"notes": "Draft note", "follow_up_date": None})
    assert r.json()["visit"]["status"] == "draft" and r.json()["appointment"]["status"] == "checked_in"
    done = complete(client, rid).json()
    assert done["appointment"]["status"] == "completed" and done["visit"]["status"] == "completed"
    assert done["visit"]["notes"] == "BP normal. Iron tablets." and done["visit"]["follow_up_date"] == day(7)
    assert done["appointment"]["history"][-1]["by"] == "doctor"
    assert raw_db().visits.count_documents({}) == 1  # draft became the final record


def test_reception_reads_notes_patient_never_does(client):
    rid = checked_in(client)
    as_doctor(client)
    complete(client, rid, notes="Private clinical note")
    code = raw_db().patients.find_one()["patient_code"]
    # doctor sees notes in the profile
    assert client.get(f"/api/staff/patients/{code}").json()["visits"][0]["notes"] == "Private clinical note"
    # reception can read the finished note and the follow-up
    client.post("/api/staff/logout")
    staff_login(client)
    prof = client.get(f"/api/staff/patients/{code}").json()
    assert prof["visits"][0]["notes"] == "Private clinical note" and prof["visits"][0]["follow_up_date"] == day(7)
    assert client.get(f"/api/doctor/appointments/{rid}").json()["visit"]["notes"] == "Private clinical note"
    assert prof["patient"]["follow_up_date"] == day(7) and prof["patient"]["last_visit"] == day(0)
    assert prof["patient"]["visits_count"] == 1
    assert "Private clinical note" not in client.get(f"/api/staff/appointments/{rid}").text
    # the patient sees the follow-up date, never the notes
    me = client.get("/api/me").json()
    assert me["follow_up_date"] == day(7)
    assert "Private clinical note" not in client.get(f"/api/appointments/{rid}").text + client.get("/api/appointments/mine").text


def test_follow_up_filter(client):
    rid = checked_in(client)
    as_doctor(client)
    complete(client, rid, follow=5)
    client.post("/api/staff/logout")
    staff_login(client)
    assert client.get("/api/staff/patients", params={"show": "follow_up"}).json()["total"] == 1


def test_previous_visit_notes_shown_at_next_visit(client):
    rid1 = checked_in(client)
    as_doctor(client)
    complete(client, rid1, notes="First visit note", follow=None)
    # next visit (moved to today for the test: pretend the first visit was last week)
    raw_db().appointments.update_one({"request_id": rid1}, {"$set": {"date": day(-7)}})
    raw_db().visits.update_one({"request_id": rid1}, {"$set": {"date": day(-7)}})
    client.post("/api/staff/logout")
    rid2 = checked_in(client)
    as_doctor(client)
    screen = client.get(f"/api/doctor/appointments/{rid2}").json()
    assert [v["notes"] for v in screen["previous_visits"]] == ["First visit note"]
    assert {a["request_id"] for a in screen["appointments"]} == {rid1, rid2}


def test_visit_rules(client):
    rid = patient_books(client)  # not checked in
    as_doctor(client)
    assert client.put(f"/api/doctor/appointments/{rid}/visit", json={"notes": "x"}).json()["error"]["code"] == "visit_not_open"
    assert complete(client, rid).json()["error"]["code"] == "invalid_transition"
    rid2 = checked_in(client, "9123456789")
    as_doctor(client)
    for bad in [day(0), day(400)]:  # follow-up must be after the visit, within a year
        r = client.post(f"/api/doctor/appointments/{rid2}/complete", json={"notes": "x", "follow_up_date": bad})
        assert r.json()["error"]["code"] == "follow_up_invalid", bad
    assert complete(client, rid2).status_code == 200
    assert complete(client, rid2).json()["error"]["code"] == "invalid_transition"  # only once
    long = client.post(f"/api/doctor/appointments/{rid2}/complete", json={"notes": "x" * 2001})
    assert long.status_code == 422


def test_completing_without_follow_up_clears_it(client):
    rid = checked_in(client)
    as_doctor(client)
    complete(client, rid, follow=7)
    raw_db().appointments.update_one({"request_id": rid}, {"$set": {"date": day(-7)}})
    client.post("/api/staff/logout")
    rid2 = checked_in(client)
    as_doctor(client)
    complete(client, rid2, follow=None)
    assert raw_db().patients.find_one()["follow_up_date"] is None
