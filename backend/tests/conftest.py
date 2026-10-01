import os

# Must be set before the app is imported (settings are read once).
os.environ.update(
    APP_ENV="test",
    MONGODB_DB="saran_test",
    SECRET_KEY="test-secret-key-that-is-long-enough-1234567890",
    OTP_MODE="demo",
    COOKIE_SECURE="false",
    CORS_ORIGINS="",
    TRUST_PROXY="false",
    BCRYPT_ROUNDS="4",  # fast hashing in tests only
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from pymongo import MongoClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def morning_clock(monkeypatch):
    """Tests run as if it were 9 AM in Chapra, so "today" windows are always still open."""
    from datetime import datetime

    from app import clinic

    monkeypatch.setattr(clinic, "now", lambda: datetime.now(clinic.CLINIC_TZ).replace(hour=9, minute=0))


@pytest.fixture(autouse=True)
def clean_db():
    """Every test starts with an empty test database (never the demo database)."""
    sync = MongoClient(os.environ.get("MONGODB_URI", "mongodb://localhost:27017"))
    sync.drop_database("saran_test")
    yield
    sync.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


NEW_PATIENT = {"name": "Sunita Devi", "gender": "female", "age": 29}


def login(client, phone="9876543210"):
    """Helper: full OTP login (registering the number first if it's new). Returns the patient JSON."""
    r = client.post("/api/auth/otp/request", json={"phone": phone})
    assert r.status_code == 200, r.text
    code = r.json()["demo_code"]
    r = client.post("/api/auth/otp/verify", json={"phone": phone, "code": code})
    if r.status_code == 409 and r.json()["error"]["code"] == "registration_required":
        r = client.post("/api/auth/otp/verify/register", json={"phone": phone, "code": code, **NEW_PATIENT})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture
def logged_in(client):
    login(client)
    return client
