# Architecture & Product Decisions

Short records of important decisions. Newest at the bottom.

## D1 — Booking order: OTP first, then date/time (2026-09-26)
Scope §6 and §25 disagree. We follow §25: mobile + OTP → date/time → details → submit.
The patient is known before booking, so "My Appointments" works immediately.

## D2 — One doctor, one doctor page (2026-09-26)
Screens 3 (Doctor) and 5 (Doctor Profile) are merged into `/doctor`. Booking pre-selects
Dr. Neela Singh instead of showing a doctor picker. No multi-doctor directory.

## D3 — Requested time windows, not fake slots (2026-09-26)
Patients pick a date and a time window (morning/afternoon/evening). The UI always says
"Request Submitted" until reception confirms. No real-time availability is claimed.

## D4 — Authentication (planned for Stage 1.3 / 2.1) (2026-09-26)
Patients: mobile number + OTP. Demo mode uses a simulated OTP (no SMS cost) but still hashes
OTPs, expires them and rate-limits requests. Staff (reception, doctor): username + hashed
password with role-based access checked on the backend.

## D5 — Custom i18n instead of a library (2026-09-26)
A ~90-line provider (`src/i18n/`) covers our needs: nested keys, `{var}` interpolation,
English fallback, lazy-loaded language files, `<html lang>` sync and remembered choice.
Avoids adding i18next (~40 KB). Hinglish uses `lang="hi-Latn"`, Bhojpuri `lang="bho"`.

## D6 — Styling: Tailwind v4 with design tokens in CSS (2026-09-26)
All colours, fonts, radii, shadows and animations are defined once in `src/index.css`
(`@theme`). Components use token classes only (e.g. `bg-primary-700`). All text/background
pairs checked to WCAG AA (≥ 4.5:1).

## D7 — Fonts: Noto Sans + Noto Serif with Devanagari companions (2026-09-26)
Loaded from Google Fonts with `display=swap`. Google serves only the scripts a page uses,
so English visitors don't download Devanagari files. Serif for headings (warm), sans for body.

## D8 — No icon or animation library (2026-09-26)
A small inline SVG icon set and CSS keyframes cover the needs. We use a generic chat icon
for WhatsApp rather than reproducing its logo. All motion respects `prefers-reduced-motion`.

## D9 — Placeholder contact details look obviously fake (2026-09-26)
Unverified phone/WhatsApp use `+91 00000 00000` so they can't be mistaken for real numbers.
Every unverified fact is listed in `src/config/clinic.js` → `NEEDS_CONFIRMATION` and shows a
"Needs client confirmation" marker (turn off with `VITE_SHOW_CONFIRMATION_MARKERS=false`).

## D10 — Local MongoDB for development, MongoDB Atlas for deployment (2026-09-26)
Hosting providers for frontend/backend will be chosen in Stage 3.3.

## D11 — Draft services list, clearly marked (2026-09-26)
No confirmed services yet. `src/config/services.js` holds a 4-item draft (women's health consultation,
pregnancy care, delivery care, follow-up visits) based only on the clinic's public association with
women's health/pregnancy care. Every item is `verified: false` and shows a confirmation marker.
Descriptions are plain and make no outcome or quality claims. Replace with the clinic's own list.

## D12 — Click-to-load map (2026-09-26)
The Google map is not loaded until the visitor taps "Show map" (uses the free embed URL, no API key).
Keeps pages light on mobile data and avoids loading third-party content by default.
"Get Directions" always opens Google Maps directly.

## D13 — Service detail pages at /services/:slug (2026-09-26)
Each service has its own page (shareable link, clear "how to book" steps, other services).
Unknown slugs show the Page-not-found screen.

## D14 — Browser tests in the repo (2026-09-26)
`npm run test:e2e` drives the system Chrome via `playwright-core` (dev dependency only, no browser
download). Covers console errors, horizontal overflow at 4 sizes, one h1 per page, link crawl,
language switching, header fit in all languages, mobile menu a11y, map loading, reduced motion.

## D15 — Card tones instead of colour overrides (2026-09-26)
`<Card tone="default|muted|brand">`. Passing `bg-*` in className can silently lose to the base
style, which caused a white-on-white bug; tones avoid that class of problem.

## D16 — Short "Book Now" label in the header (2026-09-26)
Hinglish/Bhojpuri labels are long; the header uses `common.bookShort` so the menu fits on one line
in all languages. The full "Book Appointment" label is used everywhere else.

## D17 — Fixed local ports: 5180 / 4180 / 8010 (2026-09-26)
5173 and 8000 are used by another project on the developer's machine. Ports are `strictPort`
so a clash fails loudly. MongoDB is shared but this project uses its own databases
(`saran_demo`, `saran_test`, `saran_e2e`).

## D18 — Session = signed JWT in an httpOnly cookie (2026-09-26)
Not readable by JavaScript (XSS can't steal it), `SameSite=Lax` (CSRF protection), `Secure` in
production. In development Vite proxies `/api` to the backend, so the site and API share one origin.
In production host the API on a subdomain of the clinic domain (e.g. api.<domain>) and set CORS_ORIGINS.

## D19 — OTP rules (2026-09-26)
6 digits, valid 5 minutes, one use, max 5 wrong tries, 30 s between resends, max 3 codes per number
per 10 min and 20 per IP per hour. Stored as an HMAC (keyed with SECRET_KEY), never plain text.
`OTP_MODE=demo` returns the code to the screen; the app refuses to start in production with demo OTP.
`X-Forwarded-For` is only trusted when `TRUST_PROXY=true`.

## D20 — One patient per mobile number (demo) (2026-09-26)
Logging in with a number creates/links one patient record (patient number P000001…). Booking for a
family member from the same phone is not supported yet — a likely real-world need to discuss with
the clinic (Stage 2.2 is the natural place).

## D21 — Booking guard rails (2026-09-26)
Dates: today to +30 days (closed weekdays configurable once the clinic confirms). One active request
per patient per day; at most 3 open requests. Request IDs look like SNH-7K3QX9 (no 0/O/1/I/L, easy
to read over the phone). Patients cannot see each other's appointments (404, not 403).

## D22 — `GET /api/auth/session` always returns 200 (2026-09-26)
Returns `{patient: … | null}` so guests don't produce a 401 (and a red browser console error) on every page.

## D23 — Saved language loads before first render (2026-09-26)
main.jsx loads the visitor's saved language file before rendering, so Hindi/Bhojpuri visitors never
see a flash of English. First-time visitors still download only English.

## D24 — Never reveal whether a mobile number is a patient (2026-09-29)
For a women's-health clinic, "this number is registered here" is sensitive. The OTP request answers
the same for every number; "new patient — please register" is only returned after the correct OTP
(which proves the person owns the number). Password login gives one error ("mobile number or
password is wrong") for unknown numbers, numbers without a password and wrong passwords, and runs
a dummy hash check so response time doesn't differ either.

## D25 — Patient password login: lockout + bcrypt (2026-09-29)
Password login (added alongside OTP) locks for 15 minutes after 5 wrong passwords for a number;
OTP login keeps working so the real owner is never locked out. Hashes use the `bcrypt` library
directly (no `passlib`, no OS `crypt`). Passwords are limited to 72 bytes (bcrypt's limit — checked
in bytes because Hindi letters take ~3 bytes each).

## D26 — Staff sessions use their own cookie (2026-09-29)
`snh_staff` (12 hours) is separate from the patient cookie `snh_session`, so a clinic PC where a
patient once logged in never mixes identities, and staff logout never logs a patient out.
Roles (admin / reception / doctor) are checked on the server for every request.

## D27 — One lifecycle module decides every status change (2026-09-29)
`backend/app/lifecycle.py` lists the allowed transitions. The current status is part of every update
filter, so two receptionists clicking at once can't overwrite each other ("changed elsewhere").
Each change is appended to `status_history` with who made it and an optional note. Check-in /
waiting only on the appointment day; the frontend shows only buttons the server will accept.

## D28 — Queue tokens are given at check-in (2026-09-29)
A per-day counter (`token:YYYY-MM-DD`) gives 1, 2, 3… in arrival order, so the token reflects the real
queue, not booking order. Walk-ins arriving now are checked in immediately and get the next token.

## D29 — Demo accounts and demo data only in demo mode (2026-09-29)
With `OTP_MODE=demo` and `APP_ENV` not production, three demo staff accounts are ensured at startup
and listed on the staff login page; `manage seed-demo` adds fictional patients (fake 90000 00xxx
numbers) tagged `demo`. Both are refused in production.

## D30 — Consultation notes are for the doctor only (2026-09-29)
Notes live in a separate `visits` collection (one per appointment). The doctor endpoints are
doctor-only; the staff patient profile returns notes only to the doctor role; nothing in the
patient API includes them. Reception sees visit dates and follow-up dates. Reception has its own
"front-desk notes" for practical, non-medical information.

## D31 — Draft, then complete (2026-09-29)
The doctor can save a draft while the patient is in the room (survives reloads) and then mark the
visit completed, which closes the appointment (lifecycle rules apply), stores the final note and
sets the patient's follow-up date. The latest completed visit decides the follow-up; completing
without one clears it.

## D32 — Patient identity is the mobile number (2026-09-29)
One patient record per mobile number (see D20). Reception can add patients and correct details,
including the number (refused if another patient has it); name/number changes are copied to that
patient's open appointments so the day list stays right.

## D33 — Public-listing data is never shown as fact (2026-10-01)
Details found on Justdial or similar sites are kept in `config/clinic.js → PUBLIC_LISTING` for reference.
Neutral facts (address, landmark, fee, specialisation) may be displayed only with a "Confirmation pending"
marker; ratings, review counts, emergency/24-hour claims, statistics, awards, accreditations and
testimonials are not displayed at all until the clinic confirms them in writing (scope §3, §27).
The demo always uses the fake phone number so testers never call the real clinic.

## D34 — Features awaiting approval sit behind a switch (2026-10-01)
`clinic.features` turns pages on only when the clinic has approved their content
(e.g. `healthEducation` for the periods/pregnancy guidance pages — medical text needs the doctor's sign-off).

## D35 — Clinic hours and the 7-day booking window (2026-10-01)
Confirmed by the client: consultations 10 AM – 4 PM; patients book at most 7 days ahead. Windows are
10–12 / 12–2 / 2–4 (`backend/app/clinic.py → SLOT_HOURS`). The server, not just the screen, rejects past
windows and dates outside the window. Reception keeps 30 days so follow-ups can be booked at the desk.
Old "evening" bookings are migrated to 2–4 PM on start-up (idempotent). Browser tests run the test server
with `FIXED_CLOCK_HOUR=9` (refused in production) so they don't depend on the time of day.

## D36 — Clinic photos from the public listing (2026-10-01)
Photos are edited only with ordinary corrections (crop, level, light, colour, sharpness) — never generated or
altered in content. Photos showing patients are never used. Every listing photo carries "Confirmation pending"
and a `data-replace` note until the clinic gives permission or originals. The emblem was traced from the
clinic's own sign and is used as its logo.


## D37 — Consultation fee and a demo-only payment flow (2026-10-01)
Client rule: free if the last completed visit was ≤ 14 days before the appointment day; otherwise the fee.
The server computes the fee when a request is created (and again on reschedule while unpaid); the amount is
never taken from the browser. The request is saved before payment so a failed or skipped payment never loses
a booking — the patient can pay later online, or reception marks it paid in cash. Payment is **simulated**:
no gateway, no money, no card data on our server (only brand + last 4). For production, use a PCI-DSS
compliant gateway's hosted checkout (card details go to the gateway, never to us) and treat a payment as paid
only after the gateway's signed webhook — this needs the client's approval of a provider and its fees.
The ₹300 amount is unconfirmed; refunds are recorded only.

## D38 — Reception can read consultation notes (2026-10-02)
Client request: reception/admin can view the doctor's queue (`/staff/queue`) and the visit screen, and read
finished consultation notes (visit screen and patient profile). Only the doctor can write notes, save drafts or
complete a visit — enforced on the server. Unfinished drafts stay with the doctor. Patients never see notes.
This replaces the earlier "notes are for the doctor only" rule.

## D39 — Admin role removed (2026-10-02)
Admin had exactly the same screens as reception, so the client asked to remove it. Roles are now reception and
doctor. On start-up any account with role "admin" becomes "reception" (no one loses access); the demo
`admin/admin123` account is deleted in demo mode. Staff accounts are still managed from the command line.
