"""Request/response shapes. Pydantic validates every incoming field before our code runs."""

import re
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, BeforeValidator, Field, field_validator

from .clinic import TIME_SLOTS

Gender = Literal["female", "male", "other"]
TimeSlot = Literal["morning", "midday", "afternoon"]
assert list(TimeSlot.__args__) == TIME_SLOTS


def _normalise_phone(value: str) -> str:
    """Accept '98765 43210', '+91 98765-43210', '09876543210' → '9876543210'."""
    digits = re.sub(r"\D", "", str(value))
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        raise ValueError("Enter a valid 10-digit Indian mobile number")
    return digits


Phone = Annotated[str, BeforeValidator(_normalise_phone)]


def _blank_to_none(value):
    return None if isinstance(value, str) and not value.strip() else value


OptionalText = Annotated[str | None, BeforeValidator(_blank_to_none)]


def _check_password(value: str) -> str:
    # bcrypt only uses the first 72 bytes; Hindi letters take ~3 bytes each, so check bytes, not characters.
    if len(value.encode()) > 72:
        raise ValueError("Password is too long")
    return value


Password = Annotated[str, Field(min_length=6), AfterValidator(_check_password)]


class OtpRequestIn(BaseModel):
    phone: Phone


class OtpRequestOut(BaseModel):
    sent: bool = True
    expires_in: int
    resend_in: int
    demo_code: str | None = None  # only in demo mode — shown on screen instead of an SMS


class OtpVerifyIn(BaseModel):
    phone: Phone
    code: str = Field(pattern=r"^\d{4,8}$")


class PatientRegistrationIn(BaseModel):
    """Full patient registration data collected during first-time OTP flow."""
    phone: Phone
    code: str = Field(pattern=r"^\d{4,8}$")
    name: str = Field(min_length=2, max_length=80)
    father_husband_name: OptionalText = Field(default=None, max_length=80)
    email: OptionalText = Field(default=None, max_length=120)
    gender: Gender
    age: int = Field(ge=0, le=120)
    address: OptionalText = Field(default=None, max_length=200)


class LoginWithPasswordIn(BaseModel):
    phone: Phone
    password: Password


class PatientOut(BaseModel):
    patient_code: str
    phone: str
    name: str | None = None
    age: int | None = None
    gender: Gender | None = None
    email: str | None = None
    father_husband_name: str | None = None
    address: str | None = None
    follow_up_date: date | None = None  # set by the doctor at the end of a visit


class SessionOut(BaseModel):
    patient: PatientOut | None


class LoginWithPasswordOut(BaseModel):
    patient: PatientOut


class ProfileIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    age: int = Field(ge=0, le=120)
    gender: Gender
    email: OptionalText = Field(default=None, max_length=120)

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 2:
            raise ValueError("Name is too short")
        return v

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
            raise ValueError("Invalid email")
        return v


class AppointmentIn(ProfileIn):
    date: date
    time_slot: TimeSlot
    reason: OptionalText = Field(default=None, max_length=500)
    clinic_patient_ref: OptionalText = Field(default=None, max_length=30, pattern=r"^[A-Za-z0-9/\- ]+$")


class DoctorOut(BaseModel):
    id: str
    name: str


PayMethod = Literal["upi", "card", "netbanking", "cash"]
BANKS = ["sbi", "pnb", "bob", "hdfc", "icici", "axis", "other"]


class PaymentOut(BaseModel):
    amount: int
    currency: str = "INR"
    status: Literal["free", "pending", "paid", "refunded"]
    reason: Literal["new_visit", "after_free_period", "follow_up"]
    last_visit: date | None = None
    free_until: date | None = None
    method: PayMethod | None = None
    reference: str | None = None
    paid_at: datetime | None = None
    card_brand: str | None = None
    card_last4: str | None = None
    bank: str | None = None


class QuoteOut(BaseModel):
    required: bool
    amount: int
    reason: Literal["new_visit", "after_free_period", "follow_up"]
    last_visit: date | None = None
    free_until: date | None = None
    free_days: int


class PayIn(BaseModel):
    """DEMO checkout. Never send a full card number — only its brand and last 4 digits."""
    method: Literal["upi", "card", "netbanking"]
    upi_id: str | None = Field(default=None, max_length=60, pattern=r"^[A-Za-z0-9._-]{2,40}@[A-Za-z]{2,20}$")
    card_last4: str | None = Field(default=None, pattern=r"^\d{4}$")
    card_brand: Literal["visa", "mastercard", "rupay", "amex", "other"] | None = None
    bank: Literal["sbi", "pnb", "bob", "hdfc", "icici", "axis", "other"] | None = None


class AppointmentOut(BaseModel):
    request_id: str
    patient_name: str
    doctor: DoctorOut
    date: date
    time_slot: TimeSlot
    reason: str | None = None
    status: str
    token: int | None = None
    created_at: datetime
    payment: PaymentOut | None = None


class MyAppointmentsOut(BaseModel):
    upcoming: list[AppointmentOut]
    previous: list[AppointmentOut]


class BookingOptionsOut(BaseModel):
    doctor: DoctorOut
    time_slots: list[str]
    dates: list[date]
    today: date
    open_today: list[str]  # windows still available today (earlier ones have ended)
    hours: dict[str, int]  # {"open": 10, "close": 16}
    window_days: int


StaffRole = Literal["admin", "reception", "doctor"]
Status = Literal["request_submitted", "confirmed", "checked_in", "waiting", "completed", "cancelled"]


class StaffLoginIn(BaseModel):
    username: Annotated[str, BeforeValidator(lambda v: str(v).strip().lower())] = Field(min_length=3, max_length=50)
    password: str = Field(min_length=1, max_length=200)


class StaffOut(BaseModel):
    username: str
    name: str
    role: StaffRole


class StaffSessionOut(BaseModel):
    staff: StaffOut | None


class DemoAccountOut(BaseModel):
    username: str
    password: str
    role: StaffRole


class HistoryOut(BaseModel):
    status: str
    at: datetime
    by: str
    note: str | None = None


class StaffAppointmentOut(BaseModel):
    request_id: str
    patient_code: str
    patient_name: str
    patient_phone: str
    patient_age: int | None = None
    patient_gender: Gender | None = None
    first_visit: bool = False
    date: date
    time_slot: TimeSlot
    reason: str | None = None
    clinic_patient_ref: str | None = None
    status: Status
    token: int | None = None
    source: str = "online"
    created_at: datetime
    updated_at: datetime
    history: list[HistoryOut] = []
    payment: PaymentOut | None = None


class StaffListOut(BaseModel):
    view: Literal["day", "requests"]
    date: date
    items: list[StaffAppointmentOut]


class OverviewOut(BaseModel):
    date: date
    today: date
    counts: dict[str, int]  # total + one entry per status
    new_patients: int  # first visit to the clinic, not cancelled
    pending_requests: int  # "Request Submitted" from today onwards (all days)


class StatusChangeIn(BaseModel):
    status: Status
    note: OptionalText = Field(default=None, max_length=200)


class RescheduleIn(BaseModel):
    date: date
    time_slot: TimeSlot
    note: OptionalText = Field(default=None, max_length=200)


Day = date  # alias: a field named "date" with a default would otherwise hide the type


class WalkInIn(ProfileIn):
    phone: Phone
    reason: OptionalText = Field(default=None, max_length=500)
    date: Day | None = None  # default: today
    time_slot: TimeSlot | None = None  # default: the current part of the day


# ---- Stage 2.2: patient management (staff) -----------------------------------------------------------

class PatientDetailsIn(ProfileIn):
    phone: Phone
    father_husband_name: OptionalText = Field(default=None, max_length=80)
    address: OptionalText = Field(default=None, max_length=200)


class StaffNoteIn(BaseModel):
    text: str = Field(min_length=1, max_length=300)


class StaffNoteOut(BaseModel):
    text: str
    by: str
    at: datetime


class NextAppointmentOut(BaseModel):
    request_id: str
    date: date
    time_slot: TimeSlot
    status: Status


class StaffPatientOut(BaseModel):
    patient_code: str
    name: str | None = None
    phone: str
    age: int | None = None
    gender: Gender | None = None
    email: str | None = None
    father_husband_name: str | None = None
    address: str | None = None
    source: str = "online"
    created_at: datetime
    follow_up_date: date | None = None
    last_visit: date | None = None  # last completed appointment
    visits_count: int = 0
    next_appointment: NextAppointmentOut | None = None
    notes: list[StaffNoteOut] = []  # front-desk notes (not medical)


class PatientListOut(BaseModel):
    items: list[StaffPatientOut]
    total: int
    has_more: bool


class VisitOut(BaseModel):
    request_id: str
    date: date
    follow_up_date: date | None = None
    status: Literal["draft", "completed"]
    notes: str | None = None  # only filled in for the doctor
    by: str | None = None
    updated_at: datetime


class PatientProfileOut(BaseModel):
    patient: StaffPatientOut
    appointments: list[StaffAppointmentOut]
    visits: list[VisitOut]


# ---- Stage 2.3: doctor ------------------------------------------------------------------------------

class VisitIn(BaseModel):
    notes: str | None = Field(default=None, max_length=2000)
    follow_up_date: date | None = None


class DoctorTodayOut(BaseModel):
    date: date
    queue: list[StaffAppointmentOut]  # checked in / waiting, in token order
    later: list[StaffAppointmentOut]  # booked for today, not arrived yet
    completed: list[StaffAppointmentOut]
    counts: dict[str, int]


class DoctorVisitOut(BaseModel):
    appointment: StaffAppointmentOut
    patient: StaffPatientOut
    visit: VisitOut | None  # this appointment's notes (draft or final)
    previous_visits: list[VisitOut]  # with the doctor's notes
    appointments: list[StaffAppointmentOut]  # all of this patient's appointments


# ---- Stage 3.1: notifications & analytics -----------------------------------------------------------

class NotificationOut(BaseModel):
    id: str
    type: str
    request_id: str | None = None
    params: dict[str, str] = {}
    channel: str = "whatsapp"
    delivery: str = "simulated"
    created_at: datetime
    read: bool = False


class InboxOut(BaseModel):
    items: list[NotificationOut]
    unread: int


class OutboxItemOut(NotificationOut):
    patient_name: str | None = None
    phone: str


class DayCountOut(BaseModel):
    date: date
    booked: int  # not cancelled
    completed: int
    cancelled: int


class AnalyticsOut(BaseModel):
    days: int
    start: date
    end: date
    totals: dict[str, int]  # appointments, completed, cancelled, pending, new_patients, returning_patients
    statuses: dict[str, int]
    by_day: list[DayCountOut]
    sources: dict[str, int]  # online / walk_in
    slots: dict[str, int]  # morning / midday / afternoon
