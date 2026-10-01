"""Stage 3.1: in-app notifications (simulated WhatsApp/SMS), reminders and analytics."""

from pymongo import MongoClient

from .conftest import login
from .test_patients_doctor import as_doctor, checked_in, complete
from .test_reception import WALK_IN, day, patient_books, reception, set_status, staff_login  # noqa: F401


def raw_db():
    return MongoClient("mongodb://localhost:27017")["saran_test"]


def inbox(client):
    return client.get("/api/notifications").json()


def types(client):
    return [n["type"] for n in inbox(client)["items"]]


def run_reminders(client):
    """Reminders are checked whenever the inbox, outbox or reception overview loads."""
    client.get("/api/notifications/unread")


def test_booking_sends_submitted_message(client):
    rid = patient_books(client, offset=2)
    box = inbox(client)
    assert box["unread"] == 1 and box["items"][0]["type"] == "submitted"
    n = box["items"][0]
    assert n["request_id"] == rid and n["params"]["date"] == day(2) and n["delivery"] == "simulated"


def test_confirm_reschedule_cancel_messages_in_order(client):
    rid = patient_books(client, offset=2)
    staff_login(client)
    set_status(client, rid, "confirmed")
    client.post(f"/api/staff/appointments/{rid}/reschedule", json={"date": day(4), "time_slot": "afternoon"})
    set_status(client, rid, "cancelled")
    assert types(client) == ["cancelled", "rescheduled", "confirmed", "submitted"]
    resched = inbox(client)["items"][1]
    assert resched["params"] == {"date": day(4), "time_slot": "afternoon"}


def test_check_in_and_complete_send_nothing_extra(client):
    rid = patient_books(client)
    staff_login(client)
    set_status(client, rid, "checked_in")
    set_status(client, rid, "completed")
    assert types(client) == ["submitted"]  # patient is at the clinic — no messages needed


def test_mark_read(client):
    patient_books(client, offset=1)
    assert client.get("/api/notifications/unread").json()["unread"] == 1
    assert client.post("/api/notifications/read").status_code == 204
    assert client.get("/api/notifications/unread").json()["unread"] == 0
    assert inbox(client)["items"][0]["read"] is True


def test_inbox_is_private(client):
    patient_books(client, "9876543210", offset=1)
    client.post("/api/auth/logout")
    login(client, "9123456789")
    assert inbox(client)["items"] == []
    client.post("/api/auth/logout")
    assert client.get("/api/notifications").status_code == 401


def test_day_before_reminder_once(client):
    rid = patient_books(client, offset=1)
    staff_login(client)
    set_status(client, rid, "confirmed")
    run_reminders(client)
    run_reminders(client)  # running again must not duplicate
    assert types(client).count("reminder") == 1


def test_unconfirmed_requests_get_no_reminder(client):
    patient_books(client, offset=1)
    run_reminders(client)
    assert "reminder" not in types(client)


def test_follow_up_reminder_unless_already_booked(client):
    rid = checked_in(client)
    as_doctor(client)
    complete(client, rid, follow=2)
    run_reminders(client)
    run_reminders(client)
    assert types(client).count("follow_up") == 1
    assert inbox(client)["items"][0]["params"]["follow_up_date"] == day(2)
    # a second patient who already booked their follow-up is not reminded
    rid2 = checked_in(client, "9123456789")
    as_doctor(client)
    complete(client, rid2, follow=2)
    client.post("/api/staff/logout")
    patient_books(client, "9123456789", offset=2)
    run_reminders(client)
    assert "follow_up" not in types(client)


def test_walk_in_for_later_gets_confirmation(reception):
    reception.post("/api/staff/walk-ins", json={**WALK_IN, "date": day(3), "time_slot": "afternoon"})
    reception.post("/api/staff/walk-ins", json={**WALK_IN, "phone": "9811113333"})  # now: no message
    msgs = reception.get("/api/staff/messages").json()
    assert [m["type"] for m in msgs] == ["confirmed"] and msgs[0]["phone"] == "9811112222"


def test_outbox_is_staff_only_and_filterable(client):
    rid = patient_books(client, offset=2)
    assert client.get("/api/staff/messages").status_code == 401
    staff_login(client)
    set_status(client, rid, "confirmed")
    assert len(client.get("/api/staff/messages").json()) == 2
    only = client.get("/api/staff/messages", params={"type": "confirmed"}).json()
    assert [m["type"] for m in only] == ["confirmed"] and only[0]["patient_name"] == "Sunita Devi"
    staff_login(client, "doctor", "doctor123")
    assert client.get("/api/staff/messages").status_code == 403


def test_message_failure_never_breaks_booking(client, monkeypatch):
    import app.notifications as n

    def broken(doc):
        raise RuntimeError("provider down")

    monkeypatch.setattr(n, "deliver", broken)
    login(client)
    r = client.post("/api/appointments", json={"name": "Sunita Devi", "age": 29, "gender": "female", "date": day(1), "time_slot": "morning"})
    assert r.status_code == 201


# ---- analytics ---------------------------------------------------------------------------------------

def test_analytics_numbers(client):
    r1 = checked_in(client, "9876543210")
    r2 = patient_books(client, "9123456789")
    patient_books(client, "9000000001", offset=3)  # future: counts as pending, not in the period
    staff_login(client)
    set_status(client, r2, "cancelled")
    # returning patient: an earlier completed visit before the period
    raw_db().appointments.insert_one({**raw_db().appointments.find_one({"request_id": r1}, {"_id": 0}),
                                      "request_id": "SNH-OLD111", "date": day(-60), "status": "completed"})
    set_status(client, r1, "completed")
    a = client.get("/api/staff/analytics", params={"days": 7}).json()
    assert a["totals"] == {"appointments": 1, "completed": 1, "cancelled": 1, "pending": 1,
                           "new_patients": 0, "returning_patients": 1}
    assert len(a["by_day"]) == 7 and a["by_day"][-1] == {"date": day(0), "booked": 1, "completed": 1, "cancelled": 1}
    assert a["sources"] == {"online": 1} and a["slots"]["morning"] == 1


def test_analytics_new_patients_and_access(client):
    patient_books(client, "9876543210")
    staff_login(client, "doctor", "doctor123")
    a = client.get("/api/staff/analytics", params={"days": 30}).json()
    assert a["totals"]["new_patients"] == 1 and a["days"] == 30
    assert client.get("/api/staff/analytics", params={"days": 5}).status_code == 422
    client.post("/api/staff/logout")
    assert client.get("/api/staff/analytics").status_code == 401
