# Project Status

| Milestone | Stage | Status |
|---|---|---|
| 1 — Patient Experience | 1.1 Foundation & Design System | ✅ Complete |
| | 1.2 Public Website | ✅ Complete |
| | 1.3 Patient Auth & Appointment Journey | ✅ Complete |
| 2 — Clinic Operations | 2.1 Staff Auth & Reception | ✅ Complete |
| | 2.2 Patient Management | ✅ Complete |
| | 2.3 Doctor Dashboard & Visit Workflow | ✅ Complete |
| 3 — Polish & Demo | 3.1 Notifications & Analytics | ✅ Complete |
| | 3.2 UI/UX, Localization & Quality | ✅ Complete (content audit 2026-10-01) |
| | 3.3 Final Testing, Deployment Prep & Client Demo | 🔧 Demo-ready locally; deployment docs to review; not deployed |

## Stage 1.1 — Foundation & Design System (2026-09-26)

**Built:** React 19 + Vite 8 + Tailwind 4 + React Router 7 project; design tokens; typography;
Button, Card, Badge/StatusBadge, Alert, form fields (text, phone, select, textarea, choice chips),
StateMessage (loading/empty/error), ImagePlaceholder, NeedsConfirmation marker, Reveal animation;
Header, utility bar with DEMO label + language switch, mobile menu, phone action bar, Footer;
4-language i18n; routes for all public pages (placeholders until Stage 1.2); 404 page;
internal `/design-system` page.

**Tested:** lint, build, locale key parity (85 keys × 4 languages); headless Chrome at 320/360/768/1280/1440 px:
no console errors, no horizontal overflow, one `<h1>` per page, language switching + persistence +
`<html lang>`, localised page titles, mobile menu (focus trap, Esc, focus return, closes on navigate),
skip link, reduced motion, phone field validation; WCAG AA contrast on all token pairs.

**Known issues / notes**
- Bhojpuri and Hinglish text needs review by a local speaker.
- Address is shown in English in all languages until the clinic confirms it.
- `/design-system` headings are English on purpose (internal page, hidden when `VITE_DEMO_MODE=false`).
- JS bundle is ~110 KB gzipped (mostly React + Router) — to review in Stage 3.2.

## Stage 1.2 — Public Website (2026-09-26)

**Built:** Home (hero with sample appointment card, how-booking-works, doctor highlight, services preview,
before-your-visit checklist, location + map, closing CTA); About; Doctor profile (merged screens 3 + 5);
Services list + 4 service detail pages; Before Your Visit; Find Us / Contact (click-to-load map).
All content in 4 languages (211 keys). Per-page titles and meta descriptions.

**Tested:** `npm run check` (lint, locales, build) and `npm run test:e2e` — 41/41: no console errors on 14
routes × 4 sizes, no horizontal scrolling, one h1 per page, crawl of all internal links (no broken
links, only tel/wa.me/Google Maps external links), header fits on one line at 7 widths × 4 languages,
no untranslated English on 7 pages in Hindi, map loads only on request, unknown service → not found,
service titles/meta descriptions, confirmation markers present. Visual review of screenshots at
360/390/1280/1440 in several languages.

**Known issues / notes**
- All clinic facts except the name, area and Dr. Neela Singh's role are placeholders (see list below).
- Hindi/Bhojpuri/Hinglish text uses feminine grammar for Dr. Neela Singh (e.g. "देखती हैं") — confirm with the client.
- Map pin uses a text search for the clinic name; verify it lands on the right building.

## Stage 1.3 — Patient Auth & Appointment Journey (2026-09-26)

**Built:** FastAPI backend (auth, profile, booking options, appointments) on MongoDB; mobile + OTP login
(demo OTP shown on screen); new patient registration flow (OTP → collect name, father/husband name,
email, gender, age, address → create full patient record); 4-step booking (mobile → day & time →
details → check & send); confirmation page with request ID and status progress; My Appointments
(upcoming/previous, profile, log out); login page with safe return-to-page; account link in
header/menu/footer; service pages pre-fill the booking reason. Local ports moved to 5180/4180/8010.

**Fixes applied (2026-09-28):**
- Fixed JSON syntax error in hi.json locale file
- Fixed demo data schema mismatch (doctor, time_slot, token fields)
- Added appointment status card on Home page showing upcoming appointment with progress timeline
- Added cancel appointment functionality (only for "request_submitted" status)
- Added password login option alongside OTP login (with tabbed UI)
- Added password field to form locale keys
- Added "cannot_cancel" error message to all 4 languages
- **Implemented new patient registration flow**: OTP request returns `is_new_patient` flag; registration
  form collects name, father/husband name (optional), email (optional), gender (dropdown), age,
  address (optional with "Village - Tekniwas" hint); POST `/auth/otp/verify/register` creates full
  patient record; all locale keys added for 4 languages

**Functional vs simulated:** everything is real (database, sessions, validation, rate limits) except
OTP delivery, which is simulated — the code is displayed on screen instead of sent by SMS.

**Tested (verified 2026-09-29):** backend pytest **40/40** — OTP hashing, expiry, one-time use, attempt
lock, resend cooldown, per-phone/per-IP limits, spoofed X-Forwarded-For, tampered cookie, logout,
booking validation, date window, duplicates, max open requests, privacy between patients, plus
registration (only after a correct code; OTP request reveals nothing), password login (identical
errors, 5-try lockout, bcrypt hashes, byte-length limit), online cancel (own requests only, only
while "Request Submitted", can't cancel twice). Browser journey **31/31, three runs in a row**
(Home → Doctor → Book → wrong/right OTP → new-patient registration → day & time → details → review →
submit → confirmation → My Appointments → duplicate → service pre-fill → logout lands on home →
My Appointments asks to log in again → other patient can't see it → Hindi). Public-site suite
**41/41**, twice. Lint clean, locale parity (390 keys), build pass.

**Fixed during the 2026-09-29 audit**
- ⚠️ Password login could be guessed endlessly (no lockout) → now 5 wrong tries per number per
  15 min locks password login (OTP still works), plus the per-IP limit.
- ⚠️ Privacy: the API revealed whether a mobile number belongs to a patient (OTP request returned
  `is_new_patient`; password login gave different errors for unknown number / no password / wrong
  password) → now identical answers; "new patient" is only revealed after the correct OTP.
- New-patient registration form never appeared (backend silently created an empty patient).
- Registration gender dropdown saved the browser event instead of the value, and looked like
  "Female" was chosen when nothing was → fixed, with a "Select…" first option.
- Password hashing relied on the OS `crypt` module via `passlib` (missing from requirements;
  `crypt` is removed in Python 3.13) → now the `bcrypt` library, pinned in requirements.
  Existing password hashes still work.
- Online cancel could race with reception confirming → status check is now part of the update.
- Logging out sometimes bounced the patient to the login screen instead of the home page.
- Home-page appointment card requested `/apinull` on every guest page view (console 404s) and
  flashed "No upcoming appointment" while loading.
- `StaffLoginPage.jsx` used `Navigate` without importing it (would crash when opened).
- OTP code-check limit per IP was hard-coded → now `OTP_VERIFY_PER_IP_PER_HOUR` (default 60).

**Open issues**
- Password login for patients is an addition to the scope (which specifies mobile + OTP) — keep or
  remove is a client/product decision.
- Online cancel works only while "Request Submitted"; after that, patients call the clinic.
- One patient per mobile number (see DECISIONS D20).
- No closed days configured — every day is bookable until the clinic confirms its schedule.
- Nothing is committed to git yet.

## Stage 2.1 — Staff Login & Reception (2026-09-29)

**Built:**
- Staff login (username + password, bcrypt), separate `snh_staff` cookie (12 h) — never mixed with a
  patient session on the same PC. Roles admin / reception / doctor, checked on every API request.
  Same error for unknown user and wrong password; 5 wrong passwords lock that username for 15 min.
- Demo accounts (demo mode only, listed on the login page): reception/reception123,
  doctor/doctor123, admin/admin123. Real accounts: `python -m app.manage create-staff`.
- Reception dashboard (`/staff`): date navigation, 8 stat tiles (tap to filter), Day list and
  New requests (all days) tabs, search by name / mobile / request ID / patient no., list as a
  table on desktop and cards on phones, call/WhatsApp buttons, first-visit and walk-in tags,
  quiet auto-refresh every 30 s.
- Appointment lifecycle with strict rules (`backend/app/lifecycle.py`): Confirm, Check in (gives
  the day's next token), Mark waiting, Mark completed, Reschedule (becomes Confirmed), Cancel (with
  reason). Every change is recorded in the history with who made it; concurrent changes can't
  overwrite each other. Check-in only on the appointment day.
- Walk-ins: find the patient by mobile or create them; "now" = checked in with token,
  "another day" = confirmed booking. Duplicate same-day booking refused.
- Details dialog with all actions and full history. All staff screens in 4 languages.
- Fictional demo data: `python -m app.manage seed-demo [--reset]` (15 patients, 17 appointments
  across past / today / coming days, tagged `demo` so reset removes only that).
- The earlier draft staff code was replaced (it looked up dates in the wrong format, used UTC
  instead of India time, had no transition rules/history, shared the patient cookie and passed
  search text to MongoDB as a raw regular expression).

**Tested:** backend pytest **67/67** (27 new: login, lockout, cookie separation, roles, deactivated
staff, list/search incl. regex characters, overview counts, full lifecycle with tokens & history,
invalid transitions, check-in only today, reschedule rules, walk-ins, demo accounts hidden outside
demo mode). Browser `npm run test:reception` **33/33 twice**: online booking appears → confirm →
check in (token) → waiting → completed with the patient's own page updating each time; history;
reschedule; cancel with reason; walk-in validation / create / duplicate; stat tiles; Hindi;
logout; doctor refused (403); patient session can't open staff area; phone layout without
sideways scroll. Milestone 1 suites re-run: journey 31/31, public site 41/41. Lint clean,
424 keys × 4 languages, build pass.

**Known issues / notes**
- Toasts appear behind an open dialog's dimmed backdrop (the dialog itself shows the change).
- Staff accounts are managed from the command line (no admin screen yet — not in scope).
- 5 malformed legacy test appointments were removed from the local `saran_demo` database
  (fictional test data from the earlier session: no request ID / clock times instead of
  morning-afternoon-evening); 1 invalid token on a not-checked-in test booking was cleared.

## Stage 2.2 — Patient Management (2026-09-29)

(Built straight after 2.1 at the user's request, without the stage gate; Milestone 2 reviewed as a whole.)

**Built:** Patients page (`/staff/patients`): search by name / mobile / patient no., filters All ·
Upcoming appointment · Follow-up due (within a week or missed in the last 30 days) · New (30 days),
last visit, visit count, next appointment or follow-up per patient, "Show more" paging. Add patient
(duplicate mobile refused, pointing to the existing patient no.). Patient profile: details, edit
(name/phone changes also update open appointments), follow-up card, front-desk notes (practical,
non-medical), full appointment history with tokens and statuses, doctor visits (dates + follow-ups),
"Book appointment" for the patient. Patient names in the reception list link to the profile.
Every booking — online, walk-in, reception — links to one patient record per mobile number; a
patient added at reception who later books online logs straight into the same record.

## Stage 2.3 — Doctor Dashboard & Visit Workflow (2026-09-29)

**Built:** Doctor "Today" screen: counts, patient queue in token order ("See next" highlighted),
booked-for-later list, seen-today list; refreshes by itself. Visit screen: token, patient details,
today's reason, previous visits with the doctor's notes and follow-ups, appointment history,
consultation note (up to 2000 characters), follow-up quick choices (1 week / 2 weeks / 1 month /
3 months / other date / none), Save draft, Mark visit completed. Completing sets the patient's
follow-up date (none = no follow-up). No digital prescription (out of scope).

**Privacy:** consultation notes are visible to the doctor only — reception sees visit dates and
follow-ups, patients see their follow-up date and status, never the notes (checked by tests).

**Tested (Milestone 2 total):** backend pytest **83/83** (16 new for 2.2/2.3). Browser:
`npm run test:clinic` **32/32 twice** (patient books → reception checks in → profile, edit, note,
book from profile, patients search, add patient + duplicate → doctor queue → visit → draft survives
reload → complete → "Seen today" → reception sees Completed + follow-up but not the note → patient
sees follow-up, not the note → role separation both ways → Hindi → phone layout);
`test:reception` 33/33 twice; `test:journey` 31/31; `test:e2e` 41/41. Lint clean, 503 keys × 4
languages, build pass. Demo data now includes fictional completed visits with notes and follow-ups.

**Known issues / notes**
- Reception's "Mark completed" closes an appointment without a visit record (no note/follow-up);
  the doctor's "Mark visit completed" is the full path.
- Staff accounts are managed from the command line (no admin screen — not in scope).
- The local `saran_demo` database still contains a few older test patients without names
  (from earlier testing); `seed-demo --reset` only manages the tagged demo data.

## Stage 3.1 — Notifications & Analytics (2026-09-29)

**Built:** patient Messages (header bell with unread count, `/notifications` inbox, marked read when opened);
messages for request received, confirmed, rescheduled, cancelled, day-before reminder (confirmed only) and
follow-up reminder (2 days before, skipped if already booked) — reminders are created once and checked on
page loads or by `python -m app.manage send-reminders`. WhatsApp/SMS **simulated**: staff "Messages" outbox
(reception/admin) shows every message marked Simulated. Analytics (`/staff/analytics`, all staff roles):
appointments, completed, cancelled, waiting for confirmation, new vs returning patients; appointments per day
(bars with hover/keyboard tooltip and table view), new-vs-returning split bar, by status, by booking source,
by time of day; last 7 / 30 / 90 days. Chart colours validated (colour-blind separation + contrast).

**Tested:** backend 96/96 (13 new), `test:notify` 19/19.

## Stage 3.2 — UI/UX Polish, Localization & Quality (2026-09-29 → 2026-10-01)

**Done:** accessibility audit `test:a11y` (axe-core, 49 screens incl. staff) — 4 issues fixed, **0
violations** in English and Hindi; no hard-coded UI text (only the "DEMO" badge, same in every language);
lazy-loaded pages (first download ≈ 123 KB gzipped JS); SEO basics (Open Graph tags, confirmed-facts-only
clinic structured data, `robots.txt` blocking staff/account pages, `sitemap.xml` — set `SITE_URL`);
toasts appear above open dialogs; server-down handling (`test:resilience` 8/8: friendly messages, staff
are not logged out by a server error); staff header fits on one line from 1280 px.

## Content audit & clean-up (2026-10-01)

Content added on 2026-09-30 broke the scope's rules (§3, §27 — no invented statistics, reviews, awards or
unconfirmed claims). Fixed:
- **Removed:** invented statistics ("15,000+ patients", "15 years", "98% satisfaction"), invented
  accreditations ("NABH Certified", "ISO 9001:2015", "MCI Recognized", "Bihar Medical Council"), three
  invented patient testimonials, the "24/7 emergency / open 24 hours" claims and the Justdial rating
  (4.1★, 167 reviews) from Home, About, Doctor and Contact.
- **Marked "Confirmation pending":** Justdial address & landmark, ₹300 fee, "Gynaecology & Obstetrics";
  hours and languages back to "To be confirmed".
- **Demo phone** back to the obviously fake +91 00000 00000 (Justdial's number is kept in
  `config/clinic.js → PUBLIC_LISTING` for reference only), so testers never call the real clinic.
- **Health-education pages** (`/education/*`) switched off (`clinic.features.healthEducation = false`)
  until the doctor approves the medical text.
- **Removed duplicates:** `AnalyticsDashboardPage`, `NotificationCenterPage` (`/notifications/all`), a
  second `NotificationBell`, `Animated.jsx` (included parallax — scope §18). Lint now **clean**.
- **Test restored:** the "no untranslated English on Hindi pages" check had been loosened to ignore
  words like "NABH", "Emergency", "Hours"; strict version restored and passing.
- **Docs corrected:** `DEMO_FLOW.md` rewritten (it described pie charts, a 14-day filter, doctor-only
  analytics filtering, a patient password that doesn't exist, "reviewed by locals" — none true).

**Tested after the clean-up:** backend 96/96; browser: public site 41/41, journey 31/31, reception
33/33, clinic 32/32, notifications 19/19, resilience 8/8; accessibility 49 screens / 0 violations;
lint clean; 598 keys × 4 languages; build pass.

## Stage 3.3 — Final Testing, Deployment Prep & Client Demo

- `DEPLOYMENT.md`, `SECURITY_REVIEW.md` (written 2026-09-30) — deployment and security checklists.
  Not yet reviewed line by line against the code; treat as a draft until then.
- `DEMO_FLOW.md` — corrected 14-step client demo (2026-10-01).
- **No production deployment has been done** — scope requires explicit approval first.

**Open items**
- Patient password login is an addition to the scope (mobile + OTP) — keep or remove: client decision.
- Hindi / Bhojpuri / Hinglish need a local speaker's review; Hindi texts assume a female doctor.
- All clinic facts, photos, services list and before-visit guidance still need the clinic's confirmation.

## Client changes — hours, 7-day booking, photos, mobile design (2026-10-01)

**Booking rules (confirmed by the client):** the doctor sees patients **10 AM – 4 PM**. Time windows are now
10–12, 12–2 and 2–4 (the old "evening" window was removed; existing evening bookings were moved to 2–4 PM
automatically). Patients can book **today + the next 7 days**; windows that have ended today are hidden and
refused by the server, and after 4 PM today is no longer offered. Reception keeps a 30-day window (follow-ups).
Hours are shown as confirmed on Home, Doctor and Contact. Working days are not confirmed (every day bookable).

**Clinic photos (from the clinic's Justdial listing):** the building/signboard photo was cropped, levelled and
colour-corrected (no AI, nothing added) and is the home-page hero (responsive WebP, ~30 KB on phones) and the
About gallery's "Clinic building". The clinic's emblem was cleaned from its sign into a transparent logo, now
used in the header/footer, favicon and the Android "Add to Home screen" icon (`manifest.webmanifest`).
Not used: an operation-theatre photo showing a patient (privacy), a low-quality photo whose signboard
advertises 24-hour emergency services. All photos are marked "Confirmation pending" — get the clinic's
permission or original photos before going live (scope §19).

**Found on the signboard (needs the client's answer):** a second doctor, *Dr. M.P. Singh, M.B.B.S., M.S.
(General Surgery), Consultant Surgeon* — the project assumes Dr. Neela Singh is the only doctor; and
Dr. Neela Singh's qualifications *M.B.B.S., D.G.O., M.D. (Obs & Gynae)*, now shown with "Confirmation pending".

**Mobile-first redesign (95% of visitors use phones):** reviewed Cloudnine (Indian maternity hospitals) and
Practo for patterns. Home on phones: clinic photo first with a live "Open now / Opens at 10 AM" badge,
headline, Book button, app-style Call / WhatsApp / Directions tiles, "What brings you in?" chips that start a
booking with the reason filled in, a timeline for the booking steps, swipeable service cards, compact doctor
card. Booking: 4 × 2 day grid, three equal time tiles. Bottom action bar hidden on the booking/login pages.
Animations (all off with reduced motion): slow zoom on the hero photo, staggered entrances, light sweep on the
Book button, live-dot ripple, press feedback on tiles, "pop" on selected day/time. Viewport covers notched
phones; one extra message bell on phones removed.

**Tested:** backend **101/101** (5 new booking-rule tests; a test-only fixed clock so results don't depend on
the time of day); browser: public site 41/41 (new check for content cut off on phones), journey **34/34**
(new: 8 days, hours note, 3 windows), reception 33/33, clinic 32/32, notifications 19/19, resilience 8/8;
accessibility 49 screens / 0 violations; lint clean; 604 keys × 4 languages; build pass.

## Waiting on the client
Verified phone & WhatsApp, full address & landmark, working days (hours 10 AM – 4 PM confirmed), consultation fee,
permission to use the Justdial photos (or originals), whether Dr. M.P. Singh also sees patients, Dr. Neela Singh's
qualifications/specialisation/experience, confirmed services list, real photos (exterior, reception,
waiting area, consultation room, doctor portrait), "before your visit" instructions, logo (if any).
