# Security Review Checklist — Saran Nursing Home

## ✅ Passed — Implemented in Codebase

### Environment & Secrets
- [x] **No secrets in code** — All secrets via environment variables (`.env` files gitignored)
- [x] **SECRET_KEY validation** — Production startup fails if `< 32 chars` or `"change-me"` (`config.py:39-40`)
- [x] **Separate env files** — `.env.example` templates for frontend/backend
- [x] **Frontend: no VITE_ secrets** — Only public config in `VITE_*` vars

### Authentication & Sessions
- [x] **Password hashing** — bcrypt with configurable rounds (12 production, 4 tests)
- [x] **OTP hashing** — HMAC-SHA256 with SECRET_KEY, never stored plaintext (`security.py:40-47`)
- [x] **HttpOnly cookies** — Both patient (`snh_session`) and staff (`snh_staff`) cookies are httpOnly (`security.py:64`)
- [x] **Secure cookies in production** — `COOKIE_SECURE=true` enforced by validator (`config.py:42-43`)
- [x] **SameSite=Lax** — CSRF protection on session cookies (`security.py:66`)
- [x] **Separate cookie names** — Patient and staff sessions never mix on shared device (`security.py:17,52`)
- [x] **Session expiry** — Patient: 7 days; Staff: 12 hours (one shift) (`security.py:23,53`)
- [x] **Role-based access** — `require_role()` dependency on every staff endpoint (`security.py:121-128`)

### OTP Protections
- [x] **Rate limiting per phone** — 3 requests / 10 min (`config.py:28`)
- [x] **Rate limiting per IP** — 20 requests / hour (`config.py:29`)
- [x] **Verify rate limiting** — 60 checks / hour / IP (`config.py:30`)
- [x] **Attempt limiting** — 5 wrong codes invalidates OTP (`config.py:26`)
- [x] **Resend cooldown** — 30 seconds (`config.py:27`)
- [x] **OTP TTL** — 5 minutes (`config.py:25`)
- [x] **Code single-use** — Deleted on verify (`auth.py` verify endpoint)
- [x] **Demo mode isolation** — `OTP_MODE=demo` rejected in production (`config.py:44-45`)

### Authorization
- [x] **Patient isolation** — Patients only see own appointments/notifications (`me.py`, `notifications.py`)
- [x] **Doctor isolation** — Doctor analytics filtered to own patients (`analytics.py`)
- [x] **Reception/Admin only** — Patient management, messages, walk-ins (`reception.py`, `patients.py`)
- [x] **Doctor-only endpoints** — Visit screen, today queue (`doctor.py`)
- [x] **Staff vs patient cookie separation** — Enforced in `current_patient` / `current_staff` (`security.py:87-118`)

### Input Validation
- [x] **Pydantic models** — All request bodies validated (`schemas.py`)
- [x] **Phone normalization** — Indian numbers standardized to 10 digits (`auth.py`, `PhoneField`)
- [x] **ObjectId validation** — All ID params checked before DB queries
- [x] **Regex-safe search** — Reception search uses `$regex` with escaped input (`reception.py`)
- [x] **Status transition rules** — Strict lifecycle enforced server-side (`lifecycle.py`)

### CORS & Headers
- [x] **Explicit CORS allow-list** — Never `*`, only configured origins (`main.py:44-51`)
- [x] **Credentials allowed** — `allow_credentials=True` for session cookies
- [x] **Restricted methods/headers** — Only needed HTTP methods and Content-Type
- [x] **Security headers via hosting** — CSP, HSTS, X-Frame-Options via Nginx/CDN

### Data Protection
- [x] **No real patient data** — All demo data tagged `demo: true`, fictional names/phones
- [x] **Demo data isolated** — `seed-demo --reset` only removes tagged data
- [x] **Consultation notes private** — Doctor-only, not in patient API (`doctor.py`, `patients.py`)
- [x] **Front desk notes non-medical** — Explicitly labeled practical/admin only

### Production Hardening
- [x] **Docs disabled in production** — `docs_url=None`, `redoc_url=None`, `openapi_url=None` (`main.py:38-40`)
- [x] **Error handlers** — No stack traces leaked to client (`errors.py`)
- [x] **Health endpoint** — `/api/health` for load balancer checks (`main.py:53-56`)

---

## ⚠️ Requires External Setup (Not in Code)

| Item | Responsibility | Status |
|------|----------------|--------|
| **HTTPS/TLS termination** | Hosting provider / CDN | Configure in deployment |
| **WAF / DDoS protection** | Cloudflare / AWS Shield / hosting | Optional but recommended |
| **MongoDB Atlas encryption at rest** | Atlas (enabled by default) | Verify in Atlas console |
| **MongoDB Atlas network peering / Private Link** | Atlas + hosting VPC | For production |
| **Secret rotation policy** | Operations team | Document in runbooks |
| **Vulnerability scanning** | Dependabot / Snyk / GitHub CodeQL | Enable on repo |
| **Penetration testing** | External auditor | Before go-live with real data |
| **Incident response plan** | Clinic + dev team | Document separately |

---

## 🚫 Explicitly Out of Scope (Per Project Scope)

- [ ] Real WhatsApp/SMS integration (requires provider contract, consent flow)
- [ ] Payment gateway
- [ ] Digital prescriptions / EMR
- [ ] Multi-hospital / multi-doctor
- [ ] Advanced audit logging (basic history exists)
- [ ] Data export / GDPR tooling
- [ ] Mobile apps (iOS/Android)

---

## Verification Commands

```bash
# 1. Verify no secrets in repo
git log --all --oneline --grep="SECRET_KEY\|password\|api.key"  # should be empty

# 2. Verify production config validation
cd backend && APP_ENV=production OTP_MODE=demo .venv/bin/python -c "from app.config import get_settings; get_settings()"
# Should raise: ValueError: OTP_MODE=demo is not allowed in production

# 3. Verify cookie security
cd backend && COOKIE_SECURE=false APP_ENV=production .venv/bin/python -c "from app.config import get_settings; get_settings()"
# Should raise: ValueError: COOKIE_SECURE must be true in production

# 4. Verify SECRET_KEY length
cd backend && SECRET_KEY=short APP_ENV=production .venv/bin/python -c "from app.config import get_settings; get_settings()"
# Should raise: ValueError: SECRET_KEY must be a random string of at least 32 characters

# 5. Run security-focused tests
cd backend && .venv/bin/python -m pytest tests/test_auth.py tests/test_reception.py -v -k "lockout or password or session or role"
```

---

*Security Review completed as part of Stage 3.3 Phase 1*