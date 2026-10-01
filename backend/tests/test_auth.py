from datetime import UTC, datetime, timedelta

from pymongo import MongoClient

from .conftest import NEW_PATIENT, login


def raw_db():
    return MongoClient("mongodb://localhost:27017")["saran_test"]


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_login_creates_patient_and_session(client):
    patient = login(client)
    assert patient["phone"] == "9876543210"
    assert patient["patient_code"] == "P000001"
    assert client.get("/api/me").json()["patient_code"] == "P000001"


def test_session_cookie_is_httponly_and_lax(client):
    code = client.post("/api/auth/otp/request", json={"phone": "9876543210"}).json()["demo_code"]
    r = client.post("/api/auth/otp/verify/register", json={"phone": "9876543210", "code": code, **NEW_PATIENT})
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie


def test_same_phone_logs_into_same_patient(client):
    first = login(client)
    client.post("/api/auth/logout")
    raw_db().otp_codes.delete_many({})  # skip the resend cooldown
    second = login(client)
    assert first["patient_code"] == second["patient_code"]


def test_phone_formats_are_normalised(client):
    r = client.post("/api/auth/otp/request", json={"phone": "+91 98765-43210"})
    assert r.status_code == 200
    assert raw_db().otp_codes.find_one()["phone"] == "9876543210"


def test_invalid_phone_rejected(client):
    for bad in ["12345", "5876543210", "98765432101", "abcdefghij"]:
        r = client.post("/api/auth/otp/request", json={"phone": bad})
        assert r.status_code == 422, bad
        assert r.json()["error"]["code"] == "validation_error"


def test_otp_is_stored_hashed(client):
    code = client.post("/api/auth/otp/request", json={"phone": "9876543210"}).json()["demo_code"]
    stored = raw_db().otp_codes.find_one()
    assert code not in str(stored) and len(stored["code_hash"]) == 64


def test_wrong_code_counts_attempts_then_locks(client):
    client.post("/api/auth/otp/request", json={"phone": "9876543210"})
    for left in [4, 3, 2, 1]:
        r = client.post("/api/auth/otp/verify", json={"phone": "9876543210", "code": "000000"})
        # (tiny chance the random code is 000000 — ignore that case)
        if r.status_code == 200:
            return
        assert r.status_code == 400 and r.json()["error"]["attempts_left"] == left
    r = client.post("/api/auth/otp/verify", json={"phone": "9876543210", "code": "000000"})
    assert r.status_code == 429 and r.json()["error"]["code"] == "otp_too_many_attempts"
    assert raw_db().otp_codes.count_documents({}) == 0


def test_code_works_only_once(client):
    code = client.post("/api/auth/otp/request", json={"phone": "9876543210"}).json()["demo_code"]
    body = {"phone": "9876543210", "code": code, **NEW_PATIENT}
    assert client.post("/api/auth/otp/verify/register", json=body).status_code == 200
    r = client.post("/api/auth/otp/verify", json={"phone": "9876543210", "code": code})
    assert r.status_code == 400 and r.json()["error"]["code"] == "otp_expired"


def test_expired_code_rejected(client):
    code = client.post("/api/auth/otp/request", json={"phone": "9876543210"}).json()["demo_code"]
    raw_db().otp_codes.update_one({}, {"$set": {"expires_at": datetime.now(UTC) - timedelta(seconds=1)}})
    r = client.post("/api/auth/otp/verify", json={"phone": "9876543210", "code": code})
    assert r.json()["error"]["code"] == "otp_expired"


def test_resend_cooldown(client):
    client.post("/api/auth/otp/request", json={"phone": "9876543210"})
    r = client.post("/api/auth/otp/request", json={"phone": "9876543210"})
    assert r.status_code == 429 and r.json()["error"]["code"] == "otp_resend_too_soon"


def test_per_phone_rate_limit(client):
    for i in range(3):
        raw_db().otp_codes.delete_many({})
        assert client.post("/api/auth/otp/request", json={"phone": "9876543210"}).status_code == 200, i
    raw_db().otp_codes.delete_many({})
    r = client.post("/api/auth/otp/request", json={"phone": "9876543210"})
    assert r.status_code == 429 and r.json()["error"]["code"] == "rate_limited"


def test_forwarded_for_ignored_without_trust_proxy(client):
    # Faking X-Forwarded-For must not give a fresh per-IP allowance.
    for i in range(20):
        client.post("/api/auth/otp/request", json={"phone": f"98765{i:05d}"}, headers={"X-Forwarded-For": f"1.2.3.{i}"})
    r = client.post("/api/auth/otp/request", json={"phone": "9000000099"}, headers={"X-Forwarded-For": "9.9.9.9"})
    assert r.status_code == 429


def test_me_requires_login(client):
    r = client.get("/api/me")
    assert r.status_code == 401 and r.json()["error"]["code"] == "not_authenticated"


def test_tampered_session_rejected(client):
    login(client)
    client.cookies.set("snh_session", client.cookies.get("snh_session")[:-3] + "abc")
    assert client.get("/api/me").status_code == 401


def test_session_endpoint(client):
    assert client.get("/api/auth/session").json() == {"patient": None}
    login(client)
    assert client.get("/api/auth/session").json()["patient"]["phone"] == "9876543210"


def test_logout_clears_session(client):
    login(client)
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/me").status_code == 401
