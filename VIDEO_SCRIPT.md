# Saran Nursing Home — Appointment Booking Video Script

## Video Specs
- **Duration:** 60–90 seconds
- **Format:** MP4, 1080p, 30 fps
- **Audio:** Voiceover + subtle background music
- **Languages:** Record once, add subtitles for EN/HI/BHO/HINGLISH

---

## Storyboard

| Time | Visual | Narration / Voiceover | On-Screen Text |
|------|--------|----------------------|----------------|
| **0:00–0:05** | **Homepage hero** — "Trusted care, close to home" + "Book Appointment" button | "Welcome to Saran Nursing Home. Booking an appointment takes just a minute." | Logo animation |
| **0:05–0:10** | **Click "Book Appointment"** → scroll to booking page | "Click Book Appointment anywhere on the site." | "Step 1: Your Mobile" |
| **0:10–0:18** | **Step 1 — Mobile**<br>• Enter phone: `9876543210`<br>• Tap "Send OTP"<br>• Code appears: `123456` (demo mode) | "Enter your mobile number. We'll send a 6-digit code. In demo mode, the code shows right here." | "Enter mobile → Send OTP" |
| **0:18–0:28** | **Step 2 — Register** (new patients only)<br>• Name, Father/Husband name, Email<br>• Gender dropdown, Age<br>• Address (hint: "Village - Tekniwas")<br>• Tap "Continue" | "First time? Fill in your details once. We'll remember you for next time." | "Step 2: Your Details" |
| **0:28–0:38** | **Step 3 — Day & Time**<br>• Calendar: pick tomorrow<br>• Slot cards: Morning / Afternoon / Evening<br>• Selected slot highlights | "Choose your day and preferred time slot. Morning, afternoon, or evening." | "Step 3: Day & Time" |
| **0:38–0:48** | **Step 4 — Details & Confirm**<br>• Reason pre-filled (or type your own)<br>• Review: Doctor, Date, Time, Patient, Mobile<br>• Tap "Confirm Appointment" | "Confirm your details. The reason is pre-filled from your selection." | "Step 4: Check & Send" |
| **0:48–0:55** | **Confirmation Page**<br>• Request ID: `SNH-ABC123`<br>• Status: "Request Submitted"<br>• Progress timeline (4 steps)<br>• Call / WhatsApp buttons | "Done! You get a Request ID. Track status anytime — Request Submitted → Confirmed → Checked In → Completed." | "Your Request ID: SNH-ABC123" |
| **0:55–1:02** | **Notification Bell** (top-right)<br>• Shows "1 new"<br>• Click → "Request Received" message<br>• Mark as read | "You also get a notification. Tap the bell to see it." | "🔔 1 new message" |
| **1:02–1:10** | **My Appointments**<br>• Upcoming card with status badge<br>• Tap → full detail page<br>• Language switcher: EN → HI → BHO → HINGLISH | "Check My Appointments anytime. Works in English, Hindi, Bhojpuri, and Hinglish." | "Available in 4 languages" |
| **1:10–1:15** | **Closing**<br>• Clinic name + phone + WhatsApp<br>• "Trusted care, close to home" | "Saran Nursing Home — trusted care, close to home. Book your appointment today." | Logo + contact info |

---

## Recording Checklist

### Before Recording
- [ ] Start backend: `cd backend && .venv/bin/uvicorn app.main:app --port 8010`
- [ ] Start frontend: `cd frontend && npx vite preview --port 4180`
- [ ] Seed demo data: `cd backend && .venv/bin/python -m app.manage seed-demo --reset`
- [ ] Browser: Chrome/Edge, 1920×1080, incognito mode
- [ ] Clear cache/cookies between takes

### During Recording
- [ ] Smooth mouse movements (slow, deliberate)
- [ ] Pause 1s on each key UI element
- [ ] Show mobile view (DevTools device toolbar: iPhone 14 Pro)
- [ ] Show language switcher in action

### Post-Production
- [ ] Add zoom-ins on form fields
- [ ] Add subtitle tracks (EN/HI/BHO/HINGLISH)
- [ ] Add subtle click/tap sound effects
- [ ] Background music: calm, healthcare-appropriate
- [ ] Export: MP4 (H.264), WebM (VP9) for web

---

## Alternative: Short Version (30s for Social Media)

| Time | Visual | Text Overlay |
|------|--------|--------------|
| 0–3s | Homepage → Book button | "Book in 4 steps" |
| 3–8s | Mobile + OTP | "1. Enter mobile → Get code" |
| 8–15s | Register form | "2. Fill details (once)" |
| 15–22s | Day/Time picker | "3. Pick day & slot" |
| 22–27s | Confirm screen | "4. Confirm" |
| 27–30s | Confirmation + ID | "Done! Track anytime" |

---

## Playwright Recording Command

```bash
# Record actual booking flow as MP4
cd frontend
npx playwright install chromium
npx playwright codegen --target=javascript --output=booking-demo.js http://localhost:4180/book

# Or record video directly:
npx playwright test --project=chromium --video=on tests/e2e/patient-journey.mjs
# Video saved to test-results/
```