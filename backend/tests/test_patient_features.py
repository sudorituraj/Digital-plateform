"""Tests for features added after the first Stage 1.3 build: registration, password login, online cancel."""

from datetime import timedelta

from pymongo import MongoClient

from app import clinic

from .conftest import NEW_PATIENT, login


def raw_db():
    return MongoClient("mongodb://localhost:27017")["saran_test"]


def request_code(client, phone="9876543210"):
    r = client.post("/api/auth/otp/request", json={"phone": phone})
    assert r.status_code == 200, r.text
    return r.json()


# ---- Registration & privacy ----------------------------------------------------------------------

def test_otp_request_does_not_reveal_if_number_is_a_patient(client):
    login(client, "9876543210")  # registered patient
    client.post("/api/auth/logout")
    raw_db().otp_codes.delete_many({})
    known = request_code(client, "9876543210")
    unknown = request_code(client, "9123456789")
    assert known.keys() == unknown.keys()
    assert "is_new_patient" not in known


def test_new_number_must_register_after_correct_code(client):
    code = request_code(client)["demo_code"]
    r = client.post("/api/auth/otp/verify", json={"phone": "9876543210", "code": code})
    assert r.status_code == 409 and r.json()["error"]["code"] == "registration_required"
    assert raw_db().patients.count_documents({}) == 0  # nothing created yet
    body = {"phone": "9876543210", "code": code, **NEW_PATIENT, "father_husband_name": "Ramesh", "address": ""}
    r = client.post("/api/auth/otp/verify/register", json=body)
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "Sunita Devi"
    stored = raw_db().patients.find_one()
    assert stored["father_husband_name"] == "Ramesh" and stored["address"] is None


def test_wrong_code_never_says_registration_required(client):
    request_code(client)
    r = client.post("/api/auth/otp/verify", json={"phone": "9876543210", "code": "000000"})
    assert r.json()["error"]["code"] in ("otp_invalid",)  # (1-in-a-million chance the code is 000000)


def test_register_needs_valid_code(client):
    request_code(client)
    body = {"phone": "9876543210", "code": "000000", **NEW_PATIENT}
    r = client.post("/api/auth/otp/verify/register", json=body)
    assert r.status_code == 400 and raw_db().patients.count_documents({}) == 0


# ---- Password login --------------------------------------------------------------------------------

def set_password(client, phone="9876543210", password="secret12"):
    login(client, phone)
    r = client.post("/api/auth/password/set", json={"phone": phone, "password": password})
    assert r.status_code == 200, r.text
    client.post("/api/auth/logout")


def test_password_login_works(client):
    set_password(client)
    r = client.post("/api/auth/login/password", json={"phone": "9876543210", "password": "secret12"})
    assert r.status_code == 200 and r.json()["patient"]["phone"] == "9876543210"
    assert client.get("/api/me").status_code == 200


def test_password_stored_hashed(client):
    set_password(client)
    stored = raw_db().patients.find_one()["password_hash"]
    assert stored.startswith("$2b$") and "secret12" not in stored


def test_password_errors_are_identical(client):
    set_password(client, "9876543210")  # has a password
    login(client, "9123456789")  # patient without a password
    client.post("/api/auth/logout")
    answers = [
        client.post("/api/auth/login/password", json={"phone": phone, "password": "wrongpass"})
        for phone in ["9876543210", "9123456789", "9000000001"]  # wrong pw / no pw / unknown number
    ]
    assert {r.status_code for r in answers} == {401}
    assert len({r.text for r in answers}) == 1
    assert answers[0].json()["error"]["code"] == "wrong_login"


def test_password_lockout_after_5_wrong(client):
    set_password(client)
    for _ in range(5):
        r = client.post("/api/auth/login/password", json={"phone": "9876543210", "password": "wrongpass"})
        assert r.status_code == 401
    # Locked now — even the right password is refused until the window passes.
    r = client.post("/api/auth/login/password", json={"phone": "9876543210", "password": "secret12"})
    assert r.status_code == 429 and r.json()["error"]["code"] == "password_locked"
    # OTP login still works for the real owner.
    raw_db().otp_codes.delete_many({})
    assert login(client)["phone"] == "9876543210"


def test_set_password_requires_login(client):
    r = client.post("/api/auth/password/set", json={"phone": "9876543210", "password": "secret12"})
    assert r.status_code == 401


def test_password_length_rules(client):
    login(client)
    for bad in ["12345", "अ" * 25]:  # too short; 25 Hindi letters = 75 bytes > bcrypt's 72
        r = client.post("/api/auth/password/set", json={"phone": "9876543210", "password": bad})
        assert r.status_code == 422, bad


# ---- Online cancel ---------------------------------------------------------------------------------

def book(client, days=1):
    day = (clinic.today() + timedelta(days=days)).isoformat()
    r = client.post("/api/appointments", json={**NEW_PATIENT, "date": day, "time_slot": "morning"})
    assert r.status_code == 201, r.text
    return r.json()["request_id"]


def test_cancel_own_request(logged_in):
    rid = book(logged_in)
    r = logged_in.post(f"/api/appointments/{rid}/cancel")
    assert r.status_code == 200 and r.json()["status"] == "cancelled"
    history = raw_db().appointments.find_one({"request_id": rid})["status_history"]
    assert [h["status"] for h in history] == ["request_submitted", "cancelled"]
    # A cancelled day can be booked again.
    assert book(logged_in) != rid


def test_cannot_cancel_twice_or_after_confirmation(logged_in):
    rid = book(logged_in)
    logged_in.post(f"/api/appointments/{rid}/cancel")
    assert logged_in.post(f"/api/appointments/{rid}/cancel").json()["error"]["code"] == "cannot_cancel"
    rid2 = book(logged_in, days=2)
    raw_db().appointments.update_one({"request_id": rid2}, {"$set": {"status": "confirmed"}})
    r = logged_in.post(f"/api/appointments/{rid2}/cancel")
    assert r.status_code == 400 and r.json()["error"]["code"] == "cannot_cancel"


def test_cannot_cancel_someone_elses(client):
    login(client, "9876543210")
    rid = book(client)
    client.post("/api/auth/logout")
    login(client, "9123456789")
    assert client.post(f"/api/appointments/{rid}/cancel").status_code == 404
