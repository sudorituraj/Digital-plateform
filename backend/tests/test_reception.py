"""Stage 2.1: staff login, role checks, reception list, lifecycle, reschedule and walk-ins."""

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

from app import clinic
from app.main import app

from .conftest import NEW_PATIENT, login


def raw_db():
    return MongoClient("mongodb://localhost:27017")["saran_test"]


def day(offset=0):
    return (clinic.today() + timedelta(days=offset)).isoformat()


def staff_login(client, username="reception", password="reception123"):
    r = client.post("/api/staff/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def patient_books(client, phone="9876543210", offset=0, slot="morning"):
    login(client, phone)
    r = client.post("/api/appointments", json={**NEW_PATIENT, "date": day(offset), "time_slot": slot})
    assert r.status_code == 201, r.text
    return r.json()["request_id"]


def set_status(client, rid, status, **extra):
    return client.post(f"/api/staff/appointments/{rid}/status", json={"status": status, **extra})


@pytest.fixture
def reception(client):
    staff_login(client)
    return client


# ---- login & access --------------------------------------------------------------------------------

def test_demo_staff_accounts_exist_and_login(client):
    assert {a["username"] for a in client.get("/api/staff/demo-accounts").json()} == {"reception", "doctor"}
    me = staff_login(client)
    assert me == {"username": "reception", "name": "Reception Desk", "role": "reception"}
    assert client.get("/api/staff/session").json()["staff"]["role"] == "reception"


def test_staff_passwords_stored_hashed(client):
    stored = raw_db().staff.find_one({"username": "reception"})["password_hash"]
    assert stored.startswith("$2b$") and "reception123" not in stored


def test_wrong_login_same_answer_and_lockout(client):
    unknown = client.post("/api/staff/login", json={"username": "nobody", "password": "x"})
    wrong = client.post("/api/staff/login", json={"username": "reception", "password": "wrong"})
    assert unknown.status_code == wrong.status_code == 401 and unknown.text == wrong.text
    for _ in range(4):
        client.post("/api/staff/login", json={"username": "reception", "password": "wrong"})
    r = client.post("/api/staff/login", json={"username": "reception", "password": "reception123"})
    assert r.status_code == 429 and r.json()["error"]["code"] == "login_locked"


def test_username_is_case_insensitive(client):
    assert client.post("/api/staff/login", json={"username": " Reception ", "password": "reception123"}).status_code == 200


def test_reception_endpoints_need_staff_login(client):
    for path in ["/api/staff/overview", "/api/staff/appointments"]:
        assert client.get(path).status_code == 401


def test_patient_session_is_not_staff(client):
    login(client)
    assert client.get("/api/staff/appointments").status_code == 401
    assert client.get("/api/staff/session").json() == {"staff": None}


def test_staff_and_patient_sessions_are_separate_cookies(client):
    login(client)
    staff_login(client)
    assert client.get("/api/me").status_code == 200  # patient still logged in
    client.post("/api/staff/logout")
    assert client.get("/api/me").status_code == 200  # staff logout doesn't log the patient out
    assert client.get("/api/staff/overview").status_code == 401


def test_doctor_cannot_use_reception_endpoints(client):
    staff_login(client, "doctor", "doctor123")
    r = client.get("/api/staff/appointments")
    assert r.status_code == 403 and r.json()["error"]["code"] == "forbidden"


def test_deactivated_staff_is_logged_out(reception):
    raw_db().staff.update_one({"username": "reception"}, {"$set": {"active": False}})
    assert reception.get("/api/staff/overview").status_code == 401


# ---- list, search, overview ---------------------------------------------------------------------------

def test_day_list_shows_online_booking_with_patient_details(client):
    rid = patient_books(client)
    staff_login(client)
    items = client.get("/api/staff/appointments").json()["items"]
    assert [i["request_id"] for i in items] == [rid]
    a = items[0]
    assert a["patient_name"] == "Sunita Devi" and a["patient_age"] == 29 and a["patient_gender"] == "female"
    assert a["patient_phone"] == "9876543210" and a["first_visit"] is True and a["status"] == "request_submitted"


def test_requests_view_lists_new_requests_across_days(client):
    r1 = patient_books(client, "9876543210", offset=3)
    r2 = patient_books(client, "9123456789", offset=1)
    staff_login(client)
    items = client.get("/api/staff/appointments", params={"view": "requests"}).json()["items"]
    assert [i["request_id"] for i in items] == [r2, r1]  # nearest date first
    assert client.get("/api/staff/appointments").json()["items"] == []  # nothing today


def test_search(client):
    rid = patient_books(client)
    staff_login(client)
    for q in ["sunita", "43210", rid.lower(), "P000001"]:
        items = client.get("/api/staff/appointments", params={"q": q}).json()["items"]
        assert len(items) == 1, q
    for q in ["nobody", "(", ".*", "[a-"]:  # regex characters are treated as plain text
        r = client.get("/api/staff/appointments", params={"q": q})
        assert r.status_code == 200 and r.json()["items"] == [], q


def test_overview_counts(client):
    patient_books(client, "9876543210")
    rid = patient_books(client, "9123456789")
    patient_books(client, "9000000001", offset=2)
    staff_login(client)
    set_status(client, rid, "confirmed")
    o = client.get("/api/staff/overview").json()
    assert o["counts"]["total"] == 2 and o["counts"]["request_submitted"] == 1 and o["counts"]["confirmed"] == 1
    assert o["new_patients"] == 2 and o["pending_requests"] == 2


# ---- lifecycle -------------------------------------------------------------------------------------

def test_full_visit_lifecycle_with_tokens_and_history(client):
    rid = patient_books(client, "9876543210")
    rid2 = patient_books(client, "9123456789")
    staff_login(client)
    assert set_status(client, rid, "confirmed").json()["status"] == "confirmed"
    checked = set_status(client, rid, "checked_in").json()
    assert checked["token"] == 1
    assert set_status(client, rid2, "checked_in").json()["token"] == 2  # arrived without confirming first
    assert set_status(client, rid, "waiting").json()["status"] == "waiting"
    done = set_status(client, rid, "completed").json()
    assert [h["status"] for h in done["history"]] == ["request_submitted", "confirmed", "checked_in", "waiting", "completed"]
    assert {h["by"] for h in done["history"][1:]} == {"reception"}
    # Day list: queue order by token.
    assert [i["request_id"] for i in client.get("/api/staff/appointments").json()["items"]] == [rid, rid2]


def test_patient_sees_status_set_by_reception(client):
    rid = patient_books(client)
    staff_login(client)
    set_status(client, rid, "confirmed")
    assert client.get(f"/api/appointments/{rid}").json()["status"] == "confirmed"
    # and can no longer cancel online
    assert client.post(f"/api/appointments/{rid}/cancel").json()["error"]["code"] == "cannot_cancel"


def test_invalid_transitions_rejected(client):
    rid = patient_books(client)
    staff_login(client)
    assert set_status(client, rid, "completed").json()["error"]["code"] == "invalid_transition"
    set_status(client, rid, "cancelled", note="Patient called")
    for s in ["confirmed", "checked_in", "request_submitted"]:
        r = set_status(client, rid, s)
        assert r.status_code == 409 and r.json()["error"]["code"] == "invalid_transition", s


def test_cannot_check_in_future_appointment(client):
    rid = patient_books(client, offset=2)
    staff_login(client)
    set_status(client, rid, "confirmed")
    r = set_status(client, rid, "checked_in")
    assert r.status_code == 409 and r.json()["error"]["code"] == "not_today"


def test_cancel_note_saved(client):
    rid = patient_books(client)
    staff_login(client)
    body = set_status(client, rid, "cancelled", note="Doctor on leave").json()
    assert body["history"][-1]["note"] == "Doctor on leave"


def test_unknown_appointment(reception):
    assert set_status(reception, "SNH-XXXXXX", "confirmed").status_code == 404


# ---- reschedule ------------------------------------------------------------------------------------

def test_reschedule(client):
    rid = patient_books(client, offset=1)
    staff_login(client)
    r = client.post(f"/api/staff/appointments/{rid}/reschedule", json={"date": day(4), "time_slot": "afternoon"})
    body = r.json()
    assert r.status_code == 200 and body["date"] == day(4) and body["time_slot"] == "afternoon"
    assert body["status"] == "confirmed" and body["history"][-1]["status"] == "rescheduled"


def test_reschedule_rules(client):
    rid = patient_books(client, "9876543210", offset=1)
    patient_books(client, "9876543210", offset=2)
    staff_login(client)
    url = f"/api/staff/appointments/{rid}/reschedule"
    assert client.post(url, json={"date": day(1), "time_slot": "morning"}).json()["error"]["code"] == "no_change"
    assert client.post(url, json={"date": day(2), "time_slot": "morning"}).json()["error"]["code"] == "duplicate_booking"
    assert client.post(url, json={"date": day(-1), "time_slot": "morning"}).json()["error"]["code"] == "date_unavailable"
    rid_today = patient_books(client, "9123456789")
    staff_login(client)
    set_status(client, rid_today, "checked_in")
    r = client.post(f"/api/staff/appointments/{rid_today}/reschedule", json={"date": day(3), "time_slot": "morning"})
    assert r.json()["error"]["code"] == "invalid_transition"


# ---- walk-ins --------------------------------------------------------------------------------------

WALK_IN = {"phone": "9811112222", "name": "Rekha Devi", "age": 41, "gender": "female", "reason": "Pain"}


def test_walk_in_new_patient_checked_in_with_token(reception):
    r = reception.post("/api/staff/walk-ins", json=WALK_IN)
    body = r.json()
    assert r.status_code == 201 and body["status"] == "checked_in" and body["token"] == 1
    assert body["source"] == "walk_in" and body["date"] == day(0)
    p = raw_db().patients.find_one({"phone": "9811112222"})
    assert p["name"] == "Rekha Devi" and p["source"] == "walk_in"


def test_walk_in_existing_patient_reuses_record(client):
    login(client, "9811112222")  # registered online earlier
    staff_login(client)
    client.post("/api/staff/walk-ins", json=WALK_IN)
    assert raw_db().patients.count_documents({"phone": "9811112222"}) == 1
    assert raw_db().patients.find_one()["name"] == "Rekha Devi"  # reception's details win


def test_walk_in_duplicate_same_day(reception):
    first = reception.post("/api/staff/walk-ins", json=WALK_IN).json()
    r = reception.post("/api/staff/walk-ins", json=WALK_IN)
    assert r.status_code == 409 and r.json()["error"]["request_id"] == first["request_id"]


def test_walk_in_for_later_date_is_confirmed_without_token(reception):
    body = reception.post("/api/staff/walk-ins", json={**WALK_IN, "date": day(2), "time_slot": "afternoon"}).json()
    assert body["status"] == "confirmed" and body["token"] is None


def test_walk_in_validation(reception):
    for patch in [{"phone": "123"}, {"name": ""}, {"age": 200}, {"gender": "x"}]:
        assert reception.post("/api/staff/walk-ins", json={**WALK_IN, **patch}).status_code == 422, patch


def test_demo_accounts_hidden_outside_demo_mode(monkeypatch):
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "otp_mode", "sms")
    with TestClient(app) as c:
        assert c.get("/api/staff/demo-accounts").json() == []
