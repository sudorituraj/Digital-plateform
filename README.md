# Saran Nursing Home — Digital Patient Access Platform (Demo)

A mobile-first website and appointment platform for Saran Nursing Home & Research Centre, Chapra.
It adds a digital layer around the clinic's existing workflow; it is **not** a hospital ERP/EHR.

- Full scope: [project_scope.md](project_scope.md)
- Progress: [PROJECT_STATUS.md](PROJECT_STATUS.md)
- Architecture decisions: [DECISIONS.md](DECISIONS.md)

## Project structure

```
frontend/            React + Vite + Tailwind (patient website, later staff dashboards)
  src/
    components/ui/      reusable design-system components (Button, Card, Form, Badge…)
    components/layout/  Header, Footer, MobileMenu, MobileActionBar, LanguageSelector
    components/site/    page blocks: PageHeader, CtaBand, ServiceCard, Fact, MapEmbed
    config/             clinic facts (with confirmation flags), env flags, status list
    i18n/               tiny translation provider — t('key')
    locales/            en.json, hi.json, bho.json, hinglish.json
    pages/              one file per screen
    hooks/, lib/        small helpers
  scripts/check-locales.mjs   verifies all languages have the same keys
  tests/e2e/                  browser tests (npm run test:e2e)
backend/             FastAPI + MongoDB (async PyMongo)
  app/
    main.py             app setup, CORS, routers, /api/health
    config.py           settings from .env (refuses unsafe production settings)
    clinic.py           booking rules: doctor, time slots, booking window
    security.py         session cookie (JWT), OTP hashing, current-patient check
    rate_limit.py       MongoDB-backed rate limiting
    payments.py         consultation fee (free follow-up within 14 days) + DEMO payment (no real gateway)
    routers/            auth (OTP login), me (profile), appointments
  tests/              pytest (uses a separate saran_test database)
```

## Local ports

| What | URL |
|---|---|
| Frontend (dev) | http://localhost:5180 |
| Frontend (production preview) | http://localhost:4180 |
| Backend API | http://localhost:8010 — docs at http://localhost:8010/api/docs |
| MongoDB | mongodb://localhost:27017, database `saran_demo` |

Ports are fixed on purpose (5173/8000 are used by another project on this machine).
If one is busy the server stops with an error instead of silently moving.

## Run the backend locally

Requirements: Python 3.11+ and MongoDB running locally.

```bash
cd backend
python3 -m venv .venv                          # first time only
.venv/bin/pip install -r requirements-dev.txt  # first time only
cp .env.example .env                           # first time only — then set SECRET_KEY:
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
.venv/bin/uvicorn app.main:app --reload --port 8010
```

| Command (inside `backend/`) | What it does |
|---|---|
| `.venv/bin/python -m pytest -q` | Backend tests (separate `saran_test` database) |
| `.venv/bin/python -m app.manage seed-demo [--reset]` | Add fictional demo patients, appointments and visits |
| `.venv/bin/python -m app.manage create-staff --username NAME --role reception --name "Full Name"` | Create a real staff account (password typed privately) |
| `.venv/bin/python -m app.manage deactivate-staff --username NAME` | Disable a staff account |

In demo mode (`OTP_MODE=demo`) no SMS is sent: the one-time code is shown on screen.

**Staff area:** http://localhost:5180/staff — demo accounts (demo mode only, never in production):
`reception / reception123` (reception dashboard + patients), `doctor / doctor123` (today's queue +
visits), `admin / admin123` (same as reception).

## Run the frontend locally

Requirements: Node.js 20+ and npm.

```bash
cd frontend
cp .env.example .env.local     # first time only
npm install                    # first time only
npm run dev                    # http://localhost:5180
```

Other commands (run inside `frontend/`):

| Command | What it does |
|---|---|
| `npm run build` | Production build into `frontend/dist/` |
| `npm run preview` | Serve the production build at http://localhost:4180 |
| `npm run lint` | Lint JavaScript/JSX (oxlint) |
| `npm run check:locales` | Check all 4 language files have the same keys |
| `npm run check` | Lint + locale check + build — run before every commit |
| `npm run test:e2e` | Browser tests of the public site against `npm run preview` (needs Google Chrome; set `CHROME_PATH` if elsewhere) |
| `npm run test:journey` | Full patient journey (login → book → confirmation → My Appointments). See below. |
| `npm run test:reception` | Reception workflow (confirm → check in → waiting → completed, reschedule, cancel, walk-ins). See below. |
| `npm run test:clinic` | Whole clinic workflow (reception → doctor → completed, patient management, note privacy). See below. |
| `npm run test:payment` | Demo payment: fee / free follow-up, UPI, card, net banking, pay later, cash at reception. See below. |

### Running the journey / reception / clinic tests

They book real appointments, so point them at a separate test database:

```bash
# terminal 1 (backend/)
MONGODB_DB=saran_e2e OTP_PER_IP_PER_HOUR=1000 OTP_VERIFY_PER_IP_PER_HOUR=1000 FIXED_CLOCK_HOUR=9 STAFF_LOGIN_PER_IP_PER_HOUR=1000 \
  .venv/bin/uvicorn app.main:app --port 8011
# terminal 2 (frontend/)
npm run build && API_TARGET=http://localhost:8011 npm run preview
# terminal 3 (frontend/)
npm run test:journey && npm run test:reception && npm run test:clinic && npm run test:payment
```

Internal design-system reference (demo mode only): http://localhost:5180/design-system

## Adding or changing text

Never write user-facing text directly in a component. Add a key to `src/locales/en.json`,
add the same key to `hi.json`, `bho.json` and `hinglish.json`, then use `t('section.key')`.
`npm run check:locales` fails if a language is missing a key.

## Updating clinic facts

Verified facts go in `frontend/src/config/clinic.js` (phone, WhatsApp, address, hours, doctor details)
and `frontend/src/config/services.js` (set `verified: true`). Anything left `null` shows
"To be confirmed" with a marker. Hide all markers for a clean walkthrough with
`VITE_SHOW_CONFIRMATION_MARKERS=false`.
