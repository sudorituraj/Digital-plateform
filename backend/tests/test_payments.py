"""Consultation fee (free follow-up within 14 days) and the DEMO payment flow."""

from datetime import UTC, datetime, timedelta

import pytest
from bson import ObjectId

from app import clinic, payments

from .conftest import NEW_PATIENT, login
from .test_reception import day, raw_db, set_status, staff_login

PHONE = "9876543210"


def past_visit(days_ago, phone=PHONE, status="completed"):
    """A visit the patient already had (written straight to the test database)."""
    db = raw_db()
    patient = db.patients.find_one({"phone": phone})
    db.appointments.insert_one({
        "_id": ObjectId(), "request_id": f"SNH-P{days_ago:05d}", "patient_id": patient["_id"],
        "patient_name": patient["name"], "date": (clinic.today() - timedelta(days=days_ago)).isoformat(),
        "time_slot": "morning", "status": status, "source": "online", "created_at": datetime.now(UTC),
    })


def quote(client, offset):
    r = client.get("/api/booking/quote", params={"date": day(offset)})
    assert r.status_code == 200, r.text
    return r.json()


def book(client, offset=1):
    r = client.post("/api/appointments", json={**NEW_PATIENT, "date": day(offset), "time_slot": "morning"})
    assert r.status_code == 201, r.text
    return r.json()


UPI = {"method": "upi", "upi_id": "sunita@okaxis"}
CARD = {"method": "card", "card_brand": "visa", "card_last4": "1111"}


# ---- fee rules ------------------------------------------------------------------------------------

def test_quote_needs_login(client):
    assert client.get("/api/booking/quote", params={"date": day(1)}).status_code == 401


def test_new_patient_pays(logged_in):
    q = quote(logged_in, 1)
    assert q == {"required": True, "amount": payments.CONSULTATION_FEE, "reason": "new_visit",
                 "last_visit": None, "free_until": None, "free_days": 14}


@pytest.mark.parametrize(("days_ago", "offset", "free"), [
    (5, 0, True),     # 5 days after the visit
    (10, 4, True),    # exactly 14 days → still free
    (10, 5, False),   # day 15 → pay again
    (30, 1, False),
])
def test_free_follow_up_within_14_days(logged_in, days_ago, offset, free):
    past_visit(days_ago)
    q = quote(logged_in, offset)
    assert q["required"] is not free
    if free:
        assert q["amount"] == 0 and q["reason"] == "follow_up"
        assert q["free_until"] == (clinic.today() + timedelta(days=14 - days_ago)).isoformat()
    else:
        assert q["amount"] == payments.CONSULTATION_FEE and q["reason"] == "after_free_period"


def test_cancelled_or_missed_visits_do_not_count(logged_in):
    past_visit(3, status="cancelled")
    assert quote(logged_in, 1)["required"] is True


def test_booking_stores_the_fee_decided_by_the_server(logged_in):
    appt = book(logged_in)
    assert appt["payment"]["status"] == "pending" and appt["payment"]["amount"] == payments.CONSULTATION_FEE


def test_follow_up_booking_is_free_without_paying(logged_in):
    past_visit(7)
    appt = book(logged_in)
    assert appt["payment"]["status"] == "free" and appt["payment"]["amount"] == 0
    assert logged_in.post(f"/api/appointments/{appt['request_id']}/pay", json=UPI).status_code == 409


# ---- demo checkout --------------------------------------------------------------------------------

def test_pay_by_upi(logged_in):
    rid = book(logged_in)["request_id"]
    r = logged_in.post(f"/api/appointments/{rid}/pay", json=UPI)
    assert r.status_code == 200, r.text
    p = r.json()["payment"]
    assert p["status"] == "paid" and p["method"] == "upi" and p["reference"].startswith("DEMO-")
    assert logged_in.get(f"/api/appointments/{rid}").json()["payment"]["status"] == "paid"
    kinds = [n["type"] for n in logged_in.get("/api/notifications").json()["items"]]
    assert "paid" in kinds


def test_pay_by_card_stores_only_brand_and_last_digits(logged_in):
    rid = book(logged_in)["request_id"]
    r = logged_in.post(f"/api/appointments/{rid}/pay", json=CARD)
    assert r.status_code == 200
    stored = raw_db().appointments.find_one({"request_id": rid})["payment"]
    assert stored["card_last4"] == "1111" and stored["card_brand"] == "visa"
    assert not any(len(str(v)) >= 12 and str(v).isdigit() for v in stored.values())


def test_full_card_number_is_rejected(logged_in):
    rid = book(logged_in)["request_id"]
    r = logged_in.post(f"/api/appointments/{rid}/pay", json={**CARD, "card_last4": "4111111111111111"})
    assert r.status_code == 422


def test_pay_by_netbanking(logged_in):
    rid = book(logged_in)["request_id"]
    r = logged_in.post(f"/api/appointments/{rid}/pay", json={"method": "netbanking", "bank": "sbi"})
    assert r.status_code == 200 and r.json()["payment"]["bank"] == "sbi"


def test_missing_details(logged_in):
    rid = book(logged_in)["request_id"]
    r = logged_in.post(f"/api/appointments/{rid}/pay", json={"method": "upi"})
    assert r.status_code == 422


def test_declined_card_and_failed_upi_leave_payment_pending(logged_in):
    rid = book(logged_in)["request_id"]
    r = logged_in.post(f"/api/appointments/{rid}/pay", json={**CARD, "card_last4": "0002"})
    assert r.status_code == 402 and r.json()["error"]["code"] == "payment_declined"
    r = logged_in.post(f"/api/appointments/{rid}/pay", json={"method": "upi", "upi_id": "fail@okaxis"})
    assert r.status_code == 402 and r.json()["error"]["code"] == "payment_failed"
    assert logged_in.get(f"/api/appointments/{rid}").json()["payment"]["status"] == "pending"


def test_cannot_pay_twice(logged_in):
    rid = book(logged_in)["request_id"]
    assert logged_in.post(f"/api/appointments/{rid}/pay", json=UPI).status_code == 200
    assert logged_in.post(f"/api/appointments/{rid}/pay", json=UPI).status_code == 409


def test_cannot_pay_someone_elses_appointment(client):
    login(client, "9876543210")
    rid = book(client)["request_id"]
    login(client, "9123456789")
    assert client.post(f"/api/appointments/{rid}/pay", json=UPI).status_code == 404


def test_pay_needs_login(client):
    assert client.post("/api/appointments/SNH-AAAAAA/pay", json=UPI).status_code == 401


# ---- cancellations & reception ----------------------------------------------------------------------

def test_patient_cancel_after_paying_is_refunded(logged_in):
    rid = book(logged_in)["request_id"]
    logged_in.post(f"/api/appointments/{rid}/pay", json=UPI)
    r = logged_in.post(f"/api/appointments/{rid}/cancel")
    assert r.status_code == 200 and r.json()["payment"]["status"] == "refunded"


def test_staff_cancel_after_paying_is_refunded(logged_in):
    rid = book(logged_in)["request_id"]
    logged_in.post(f"/api/appointments/{rid}/pay", json=UPI)
    staff_login(logged_in)
    r = set_status(logged_in, rid, "cancelled")
    assert r.status_code == 200 and r.json()["payment"]["status"] == "refunded"


def test_reception_marks_cash_paid(logged_in):
    rid = book(logged_in)["request_id"]
    staff_login(logged_in)
    listed = logged_in.get(f"/api/staff/appointments/{rid}").json()
    assert listed["payment"]["status"] == "pending"
    r = logged_in.post(f"/api/staff/appointments/{rid}/paid-at-clinic")
    assert r.status_code == 200, r.text
    assert r.json()["payment"]["status"] == "paid" and r.json()["payment"]["method"] == "cash"
    assert logged_in.post(f"/api/staff/appointments/{rid}/paid-at-clinic").status_code == 409


def test_doctor_cannot_mark_paid(logged_in):
    rid = book(logged_in)["request_id"]
    staff_login(logged_in, "doctor", "doctor123")
    assert logged_in.post(f"/api/staff/appointments/{rid}/paid-at-clinic").status_code == 403


def test_walk_in_fee_follows_the_same_rule(client):
    staff_login(client)
    r = client.post("/api/staff/walk-ins", json={"phone": "9000000001", **NEW_PATIENT, "date": day(0), "time_slot": "morning"})
    assert r.status_code == 201, r.text
    assert r.json()["payment"]["status"] == "pending"


def test_reschedule_recomputes_unpaid_fee(logged_in):
    past_visit(10)
    rid = book(logged_in, 4)["request_id"]  # day 14 → free
    staff_login(logged_in)
    r = logged_in.post(f"/api/staff/appointments/{rid}/reschedule", json={"date": day(6), "time_slot": "morning"})
    assert r.status_code == 200, r.text
    assert r.json()["payment"]["status"] == "pending"  # day 16 → pays
