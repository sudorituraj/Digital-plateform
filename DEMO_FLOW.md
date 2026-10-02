# Client Demo Flow — Saran Nursing Home

A 15–20 minute walkthrough of the whole story: **patient books → reception → doctor → completed**.
Every step below was checked against the running app.

## Before the demo

```bash
# 1. Backend (terminal 1)
cd backend && .venv/bin/uvicorn app.main:app --port 8010
# 2. Fresh fictional demo data (optional, any time)
cd backend && .venv/bin/python -m app.manage seed-demo --reset
# 3. Website (terminal 2)
cd frontend && npm run dev          # → http://localhost:5180
```

Use two browser windows: one **normal** (patient) and one **private/incognito** (staff), so the
patient and staff logins don't mix.

## Accounts (demo mode only)

| Role | Login | Where |
|---|---|---|
| Patient | any 10-digit mobile starting 6–9 that hasn't been used before; the one-time code is **shown on screen** | `/book` or `/login` |
| Reception | `reception` / `reception123` | `/staff/login` (the login page lists these — just tap one) |
| Doctor | `doctor` / `doctor123` | `/staff/login` |
| Admin | `admin` / `admin123` (same screens as reception) | `/staff/login` |

## The 14 steps

1. **Website** — `http://localhost:5180/`. Hero "Trusted care, close to home", Book / Call / WhatsApp,
   how booking works, Dr. Neela Singh, services, before-your-visit checklist, location.
   *Say:* "Made for phones first; works in four languages."
2. **About the clinic** — `/about`. Photo spaces are clearly marked "Real photo coming soon"; history and
   facilities say "To be confirmed". *Say:* "Everything marked 'Confirmation pending' is waiting for your details."
3. **Dr. Neela Singh** — `/doctor`. Profile, availability, areas of care; unconfirmed facts are marked.
   *Say:* "One doctor, one profile — no fake directory."
4. **Book an appointment** — `/book`: mobile number → code shown on screen → new-patient details
   (name, gender, age) → day & time (10–12 / 12–2 / 2–4) → details → check & send.
   **Payment (demo):** a new patient sees "Consultation fee: ₹300" when choosing a day; after "Send request & pay"
   choose UPI (any ID like `name@okaxis`), Card (`4111 1111 1111 1111`, any future expiry, any CVV) or Net banking.
   Show a failure too: card ending `0002` is declined, UPI ID `fail@okaxis` fails. "Pay later" also works.
   *Say:* "Demo only — no money moves. A real gateway is connected after you choose one."
   Free follow-up: a patient whose last visit was within 14 days sees "Free follow-up visit" and skips payment.
5. **Confirmation** — "Appointment Request Submitted", request ID (e.g. `SNH-7K2QXM`), status steps.
   The **Messages bell** shows 1 new message ("We received your appointment request").
   *Say:* "It's a request until the clinic confirms — we never promise a time we can't keep."
6. **Reception** — staff window → `/staff` → Reception. Today's numbers, Day list / New requests,
   search by name, mobile or ID. The new booking is under **New requests** (or the day list if booked for today).
   Each row shows Paid / Free follow-up / Payment pending; **Details → Mark paid (cash)** for desk payments.
7. **Confirm & check in** — **Confirm** (patient's bell gets "Your appointment is confirmed").
   For a same-day booking: **Check in** → queue **token** appears. **Details** shows the full history: who did what, when.
8. **Doctor** — log in as `doctor` → **Today**: patients at the clinic in token order, "See next" first.
9. **Visit** — open the patient: today's reason, previous visits and notes, appointment history.
   Write a consultation note → **Save draft** → reload → the draft is still there.
10. **Follow-up & complete** — choose "2 weeks" → **Mark visit completed** → patient moves to "Seen today".
11. **What others see** — Reception: the appointment is *Completed*; **Doctor's queue** and the patient profile
    show the doctor's note **read-only** (only the doctor can write it). Patient: *My Appointments* shows the
    follow-up date, never the note. *Say:* "Reception can read the notes; patients never see them."
12. **Messages** — reception → **Messages**: every WhatsApp message the system would send, clearly marked
    **Simulated**. *Say:* "Nothing is sent in the demo; a WhatsApp/SMS provider can be connected after you approve it."
13. **Analytics** — **Analytics**: appointments, completed, cancelled, waiting for confirmation, new vs
    returning patients; appointments per day (hover a bar, or "Show as table"); by status, how they booked,
    time of day. Last 7 / 30 / 90 days. *Say:* "Simple numbers for the clinic — not a complicated system."
14. **Languages** — switch English → हिंदी → भोजपुरी → Hinglish on any page, patient or staff.

## Key messages

| Topic | Message |
|---|---|
| Not a hospital ERP | "A digital front door that works alongside your existing paper workflow." |
| Your details | "Phone, hours, fee, qualifications and photos are placeholders until you confirm them." |
| No real SMS/WhatsApp yet | "Codes and messages are simulated in the demo; a provider is added after your approval." |
| Privacy | "The doctor's notes are visible only to the doctor." |
| Languages | "Hindi, Bhojpuri and Hinglish text should be checked by someone local before going live." |

## Reset between demos

```bash
cd backend && .venv/bin/python -m app.manage seed-demo --reset
```
This replaces only the tagged fictional demo data.
