from datetime import timedelta

from app import clinic

from .conftest import login

DETAILS = {"name": "Sunita  Devi", "age": 29, "gender": "female", "email": "", "reason": "Check-up"}


def a_date(days=1):
    return (clinic.today() + timedelta(days=days)).isoformat()


def book(client, days=1, **extra):
    return client.post("/api/appointments", json={**DETAILS, "date": a_date(days), "time_slot": "morning", **extra})


def test_booking_options(client):
    r = client.get("/api/booking/options").json()
    assert r["doctor"]["name"] == "Dr. Neela Singh"
    assert r["time_slots"] == ["morning", "afternoon", "evening"]
    assert r["dates"][0] == clinic.today().isoformat()


def test_booking_requires_login(client):
    assert book(client).status_code == 401


def test_book_appointment(logged_in):
    r = book(logged_in)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["request_id"].startswith("SNH-") and len(body["request_id"]) == 10
    assert body["status"] == "request_submitted"
    assert body["patient_name"] == "Sunita Devi"  # extra spaces cleaned
    assert body["doctor"]["id"] == "dr-neela-singh"
    # profile updated from booking details; blank email stored as null
    me = logged_in.get("/api/me").json()
    assert me["name"] == "Sunita Devi" and me["age"] == 29 and me["email"] is None


def test_get_own_appointment_and_case_insensitive_id(logged_in):
    rid = book(logged_in).json()["request_id"]
    assert logged_in.get(f"/api/appointments/{rid.lower()}").status_code == 200


def test_cannot_see_other_patients_appointment(client):
    login(client, "9876543210")
    rid = book(client).json()["request_id"]
    client.post("/api/auth/logout")
    login(client, "9123456789")
    r = client.get(f"/api/appointments/{rid}")
    assert r.status_code == 404


def test_my_appointments_split(logged_in):
    book(logged_in, days=2)
    book(logged_in, days=5)
    mine = logged_in.get("/api/appointments/mine").json()
    assert [a["date"] for a in mine["upcoming"]] == [a_date(2), a_date(5)]
    assert mine["previous"] == []


def test_past_and_far_future_dates_rejected(logged_in):
    for days in [-1, clinic.BOOKING_WINDOW_DAYS + 1]:
        r = book(logged_in, days=days)
        assert r.status_code == 400 and r.json()["error"]["code"] == "date_unavailable"


def test_duplicate_same_day_rejected(logged_in):
    assert book(logged_in).status_code == 201
    r = book(logged_in, time_slot="evening")
    assert r.status_code == 409 and r.json()["error"]["code"] == "duplicate_booking"


def test_max_active_requests(logged_in):
    for d in range(1, clinic.MAX_ACTIVE_REQUESTS + 1):
        assert book(logged_in, days=d).status_code == 201
    r = book(logged_in, days=10)
    assert r.status_code == 409 and r.json()["error"]["code"] == "too_many_active"


def test_validation(logged_in):
    bad = [
        {"name": "A"},
        {"age": 150},
        {"gender": "x"},
        {"time_slot": "night"},
        {"email": "not-an-email"},
        {"reason": "x" * 501},
        {"clinic_patient_ref": "<script>"},
    ]
    for patch in bad:
        r = book(logged_in, **patch)
        assert r.status_code == 422, patch
        assert r.json()["error"]["code"] == "validation_error"
