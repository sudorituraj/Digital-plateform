# Saran Nursing Home — Deployment Guide

## Overview
This document describes how to deploy the Saran Nursing Home digital patient-access platform to production.

**Stack:** React 19 + Vite 8 + Tailwind 4 (frontend) → FastAPI + MongoDB Atlas (backend)

---

## Prerequisites
- Node.js 20+ (for frontend build)
- Python 3.11+ (for backend)
- MongoDB Atlas account (or self-hosted MongoDB)
- Domain name (e.g., `sarannursinghome.in`)
- HTTPS certificate (managed by hosting provider)

---

## 1. Environment Variables

### Backend (`.env` — NEVER commit this file)
```bash
# Application
APP_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net
MONGODB_DB=saran_production

# Security - GENERATE A NEW SECRET FOR PRODUCTION
# python3 -c "import secrets; print(secrets.token_urlsafe(48))"
SECRET_KEY=<your-64-char-random-string>

# OTP - MUST be "sms" in production (requires SMS provider integration)
OTP_MODE=sms

# Session cookie - MUST be true in production (HTTPS only)
COOKIE_SECURE=true

# CORS - Only needed if frontend and API are on different domains
# Comma-separated list, e.g. "https://sarannursinghome.in,https://www.sarannursinghome.in"
CORS_ORIGINS=https://sarannursinghome.in

# Only true when behind a hosting proxy/load balancer that sets X-Forwarded-For
TRUST_PROXY=true
```

### Frontend (`.env.production` or hosting provider env vars)
```bash
# Disable demo banner and confirmation markers in production
VITE_DEMO_MODE=false
VITE_SHOW_CONFIRMATION_MARKERS=false

# Production API base URL
VITE_API_BASE_URL=https://api.sarannursinghome.in/api
```

---

## 2. Build Commands

### Frontend
```bash
cd frontend
npm ci                    # Clean install
npm run build             # Outputs to dist/
```

**Output:** Static files in `frontend/dist/` ready for static hosting.

### Backend
```bash
cd backend
.venv/bin/pip install -r requirements.txt
# No build step needed for FastAPI — run directly with uvicorn
```

---

## 3. Production Start Commands

### Backend (with Gunicorn + Uvicorn workers)
```bash
cd backend
.venv/bin/gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8010 \
  --timeout 30 \
  --keep-alive 5
```

Or with systemd/service manager (see `backend/saran-api.service` below).

### Frontend (static hosting)
Serve `frontend/dist/` via:
- Netlify / Vercel / Cloudflare Pages (recommended)
- Nginx / Apache
- Any static file CDN

---

## 4. MongoDB Atlas Setup

1. Create a cluster (M10+ recommended for production)
2. Create database user with readWrite on `saran_production`
3. Whitelist deployment IPs (or 0.0.0.0/0 with strong password)
4. Connection string format:
   ```
   mongodb+srv://<user>:<password>@cluster0.mongodb.net/saran_production?retryWrites=true&w=majority
   ```

### Indexes (created automatically on first run)
The application creates these indexes on startup:
- `patients.phone` (unique)
- `appointments.request_id` (unique)
- `appointments.patient_id + date`
- `notifications.patient_id + created_at`
- `staff.username` (unique)

---

## 5. Domain & HTTPS

### Recommended Setup
| Service | Domain | Purpose |
|---------|--------|---------|
| Frontend | `https://sarannursinghome.in` | Patient-facing website |
| API | `https://api.sarannursinghome.in` | Backend API |
| (Optional) | `https://staff.sarannursinghome.in` | Staff portal subdomain |

### DNS Records
```
A     sarannursinghome.in     → <frontend hosting IP>
A     api.sarannursinghome.in → <backend hosting IP>
CNAME www                     → sarannursinghome.in
```

### HTTPS
- Use hosting provider's managed SSL (Let's Encrypt auto-renewal)
- Ensure `COOKIE_SECURE=true` and `TRUST_PROXY=true` in backend

---

## 6. Production Service Files

### Backend systemd Service (`/etc/systemd/system/saran-api.service`)
```ini
[Unit]
Description=Saran Nursing Home API
After=network.target

[Service]
Type=exec
User=www-data
WorkingDirectory=/opt/saran/backend
EnvironmentFile=/opt/saran/backend/.env
ExecStart=/opt/saran/backend/.venv/bin/gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8010 \
  --timeout 30 \
  --keep-alive 5 \
  --access-logfile /var/log/saran/api-access.log \
  --error-logfile /var/log/saran/api-error.log
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Frontend Nginx Config (`/etc/nginx/sites-available/saran-frontend`)
```nginx
server {
    listen 443 ssl http2;
    server_name sarannursinghome.in www.sarannursinghome.in;

    ssl_certificate /etc/letsencrypt/live/sarannursinghome.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sarannursinghome.in/privkey.pem;

    root /opt/saran/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}

server {
    listen 80;
    server_name sarannursinghome.in www.sarannursinghome.in;
    return 301 https://$server_name$request_uri;
}
```

---

## 7. Backup Strategy

### MongoDB Atlas (Recommended)
- Enable **Continuous Backup** (point-in-time recovery)
- Or schedule **Daily Snapshots** with 30-day retention
- Test restore procedure quarterly

### Self-Hosted MongoDB
```bash
# Daily backup cron
0 2 * * * mongodump --uri="mongodb://localhost:27017/saran_production" --out=/backups/saran/$(date +\%F)

# Keep 30 days
0 3 * * * find /backups/saran -type d -mtime +30 -exec rm -rf {} +
```

### Application Files
- Version control (Git) for all code
- `.env` files backed up separately (encrypted)
- Build artifacts reproducible from source

---

## 8. Monitoring & Logs

### Health Checks
- Backend: `GET /api/health` → `{"status":"ok"}`
- Frontend: `GET /` → 200 OK

### Key Metrics to Monitor
| Metric | Alert Threshold |
|--------|-----------------|
| API error rate (5xx) | > 1% over 5 min |
| API latency (p95) | > 2 seconds |
| MongoDB connections | > 80% of limit |
| Disk space | < 20% free |

### Log Locations
- Backend: `/var/log/saran/api-*.log` (via systemd/journald)
- Nginx: `/var/log/nginx/saran-*.log`
- MongoDB: Atlas logs or `/var/log/mongodb/`

---

## 9. Rollback Procedure

### Frontend (Static Hosting)
```bash
# Netlify/Vercel: Click "Rollback" in dashboard to previous deploy
# Or redeploy previous commit:
git checkout <previous-tag>
npm run build && deploy
```

### Backend
```bash
# 1. Stop service
systemctl stop saran-api

# 2. Deploy previous version
cd /opt/saran
git checkout <previous-tag>
.venv/bin/pip install -r requirements.txt

# 3. Run migrations if any (currently none — schema is code-driven)
# 4. Start service
systemctl start saran-api

# 5. Verify health
curl https://api.sarannursinghome.in/api/health
```

### Database
- MongoDB Atlas: Use point-in-time restore from backup
- Self-hosted: Restore from `mongodump` archive

---

## 10. Pre-Launch Checklist

- [ ] `.env` files created with production values (SECRET_KEY ≥ 32 chars, COOKIE_SECURE=true, OTP_MODE=sms)
- [ ] MongoDB Atlas cluster running, user created, IPs whitelisted
- [ ] Domain DNS configured, HTTPS certificates issued
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend starts and passes health check
- [ ] CORS_ORIGINS matches frontend domain exactly
- [ ] TRUST_PROXY=true (if behind load balancer)
- [ ] Demo mode OFF (`VITE_DEMO_MODE=false`)
- [ ] Confirmation markers OFF (`VITE_SHOW_CONFIRMATION_MARKERS=false`)
- [ ] Backup configured and tested
- [ ] Monitoring/alerting configured
- [ ] Rollback procedure documented and tested
- [ ] Demo data seed NOT run in production database

---

## 11. Post-Launch Verification

Run through the **Client Demo Flow** (14 steps) to verify:
1. Home page loads, shows clinic info
2. Doctor profile displays
3. Book appointment → OTP → confirmation
4. Reception login → sees appointment
5. Check-in → token assigned
6. Doctor login → sees patient in queue
7. Visit note + follow-up → complete
8. Analytics shows data
9. Language switcher works (4 languages)
10. Mobile layout works
11. No console errors
12. HTTPS on all pages
13. Cookies secure + httpOnly
14. Demo data NOT visible

---

## 12. Support Contacts

| Component | Contact |
|-----------|---------|
| Frontend hosting | [Provider support] |
| Backend hosting | [Provider support] |
| MongoDB Atlas | [Atlas support] |
| Domain/DNS | [Registrar support] |
| SSL certificates | [Hosting/Let's Encrypt] |

---

## 13. Cost Estimate (Monthly, Approximate)

| Service | Tier | Est. Cost |
|---------|------|-----------|
| MongoDB Atlas | M10 (2 GB RAM, 10 GB storage) | ~$57/mo |
| Backend hosting | 2 vCPU, 4 GB RAM (e.g., Render, Railway, Fly.io) | ~$25-50/mo |
| Frontend hosting | Netlify/Vercel/Cloudflare Pages (free tier) | $0-20/mo |
| Domain | .in / .com | ~$10-15/yr |
| **Total** | | **~$85-120/mo** |

---

*Generated as part of Stage 3.3 — Deployment Preparation*