# Saran Nursing Home & Research Centre
## Digital Patient Access Platform — Demo Project Scope

**Document:** `project_scope.md`  
**Project type:** Client demonstration / pilot-ready web application  
**Primary audience:** Patients, reception staff, doctor/owner  
**Primary language:** Simple English  
**Additional languages:** Hindi, Bhojpuri, Hinglish  
**Initial deployment:** Web application only  
**Important:** This is NOT a full hospital ERP/EHR and must NOT replace the clinic's existing physical medical workflow.

---

# 1. Project Objective

Build a polished, modern, mobile-first digital patient-access platform for **Saran Nursing Home & Research Centre, Chapra, Bihar**.

The purpose of this project is to demonstrate how a small nursing home can add a digital layer around its existing physical workflow.

The platform should make it easier for patients to:

- Find reliable information about the clinic
- Learn about the doctor and available services
- Request/book an appointment
- Receive appointment confirmation/status
- Find the clinic location
- Contact the clinic by phone or WhatsApp
- Receive basic appointment/follow-up notifications

The platform should help the clinic/reception to:

- View and manage appointments
- Register/search patients
- Track appointment status
- Maintain basic patient visit history
- Manage the daily patient queue
- View simple operational statistics

The platform must NOT attempt to replace physical consultation, physical prescriptions, existing medical procedures, or the clinic's established workflow.

---

# 2. Important Product Positioning

This is a **digital front door / patient-access platform**, not a hospital management system.

Core concept:

Patient:
Discover → Understand → Book/Request → Receive Confirmation → Visit Clinic → Follow Up

Clinic:
Receive Appointment → Confirm → Check In → Manage Queue → Complete Visit → Follow Up

The digital system should work ALONGSIDE the clinic's existing physical process.

Do not design the product as if the clinic is a large corporate hospital.

---

# 3. Known Client Context

Public research indicates:

- Saran Nursing Home & Research Centre is located in Sadhnapuri/Sadhapur, Chapra, Bihar.
- The facility has a public Justdial presence.
- Public listings expose appointment/contact/WhatsApp-related functionality.
- Public listings associate the facility strongly with gynecology/obstetric care.
- Dr. Neela Singh is the owner/primary doctor according to client-provided information and should be treated as the central doctor identity for the demo.
- The clinic is locally oriented and should feel personal, trustworthy, and approachable.

IMPORTANT:
Any doctor qualification, exact specialization, consultation fee, phone number, operating hours, service list, emergency availability, claims, awards, statistics, or other factual information that has not been explicitly verified by the client must be marked as:
`NEEDS CLIENT CONFIRMATION`

Do not invent medical credentials, services, statistics, reviews, or claims.

---

# 4. Primary User Types

## 4.1 Patient

Mostly mobile users.

Likely requirements:

- Simple language
- Large buttons
- Minimal typing
- Phone-number-first authentication
- Easy appointment flow
- Clear contact information
- Easy navigation
- Hindi/Bhojpuri/Hinglish support

## 4.2 Reception / Clinic Staff

Desktop/tablet-oriented.

Needs:

- Appointment dashboard
- Search
- Patient registration
- Status management
- Walk-in handling
- Basic patient history

## 4.3 Doctor / Owner

Simple dashboard.

Needs:

- Today's appointments
- Patient queue
- Basic patient history
- Basic consultation notes
- Follow-up date

---

# 5. Technology Direction

Recommended stack:

## Frontend
- React
- Vite
- Tailwind CSS
- Responsive/mobile-first design

## Backend
- Python
- FastAPI
- REST API

## Database
- MongoDB / MongoDB Atlas

## Authentication
- Phone number + OTP
- Email optional
- Role-based access for staff/doctor/admin

## Deployment
Use a simple cloud deployment architecture suitable for a first-time deployment.

Preferred conceptual architecture:

Frontend → Cloud frontend hosting
Backend → Cloud application hosting
Database → MongoDB Atlas
Domain → Clinic-owned domain
HTTPS → Hosting/CDN managed SSL

Do NOT introduce Kubernetes, microservices, complex AWS infrastructure, or unnecessary DevOps complexity.

---

# 6. Core Screens

## PUBLIC / PATIENT SIDE

### Screen 1 — Home

Purpose:
Create trust and immediately explain what the clinic offers.

Content:
- Clinic name
- Short trust-focused headline
- Short description
- Dr. Neela Singh highlight
- Primary CTA: `Book Appointment`
- Secondary CTA: `Call`
- Secondary CTA: `WhatsApp`
- Services preview
- Doctor preview
- Clinic image
- Location preview
- Patient-friendly information

Hero copy must be simple and local.

Avoid corporate language such as:
"Advanced healthcare ecosystem"
"Comprehensive multispecialty healthcare delivery"

Prefer:
"Trusted care, close to home."
"Book your appointment easily."
"Get the information you need before visiting."

All final factual claims require client confirmation.

---

### Screen 2 — About the Clinic

Content:
- About Saran Nursing Home
- History/experience only if verified
- Clinic photographs
- Facilities only if verified
- Location
- Contact

Do not invent history.

---

### Screen 3 — Doctor

Because the client has stated that Dr. Neela Singh is the owner and only doctor seeing patients, do NOT create a fake multi-doctor directory.

Display:
- Dr. Neela Singh
- Approved photograph
- Verified qualification
- Verified specialization
- Verified experience
- Consultation information
- Available days/times, if confirmed
- Book Appointment

Use a premium but warm doctor profile.

---

### Screen 4 — Services

Show only services confirmed by the clinic.

Each service card:
- Service name
- Short simple description
- Optional icon/photo
- `Book Appointment` CTA

Do not copy every automatically generated Justdial category into the application without verification.

---

### Screen 5 — Doctor Profile

Detailed doctor page.

Sections:
- Photo
- Name
- Verified credentials
- Areas of care
- Experience, if confirmed
- Availability
- Appointment CTA

---

### Screen 6 — Appointment Booking

The most important patient workflow.

Flow:

1. Select doctor
2. Select date
3. Select available/requested time
4. Enter patient details
5. Enter reason for visit (optional)
6. Confirm

Patient fields:
- Full name
- Mobile number
- Age/date of birth as appropriate
- Gender
- Optional email
- Reason for visit
- Optional existing patient ID

Keep the form short.

---

### Screen 7 — Appointment Confirmation

Display:
- Success state
- Appointment/request ID
- Patient name
- Doctor
- Date
- Time/requested time
- Status
- Clinic contact

Actions:
- Call clinic
- WhatsApp clinic
- View appointment
- Return home

If real-time doctor availability is not implemented, use language:
`Appointment Request Submitted`
rather than falsely claiming a confirmed slot.

---

### Screen 8 — Find Us / Contact

Include:
- Verified address
- Map
- Nearby landmark, if verified
- Phone
- WhatsApp
- Opening/consultation hours, if verified
- Directions CTA

---

### Screen 9 — Before Your Visit

Patient-friendly information:
- What to bring
- Previous reports
- Existing prescriptions/medicines
- Appointment details
- Arrival guidance

Only publish instructions approved by the clinic.

---

# 7. Authentication

## Patient authentication

Primary:
`Mobile number + OTP`

Email:
Optional.

Do not force email registration.

Flow:

Enter mobile → Send OTP → Enter OTP → Verify → Patient account

For the development/demo environment:
- OTP may be simulated.
- Do NOT spend money on an SMS provider during demo development unless explicitly required.

For production:
- Use a proper OTP/SMS provider.
- Never store plaintext OTPs.
- Implement expiry and attempt limits.
- Rate-limit OTP requests.

---

# 8. Patient Account / My Appointments

Patient should be able to see:

- Upcoming appointment
- Previous appointments
- Appointment status
- Basic profile

Appointment status examples:
- Request Submitted
- Confirmed
- Checked In
- Waiting
- Completed
- Cancelled

Do not promise exact waiting time unless the clinic has a reliable mechanism to calculate it.

---

# 9. Reception / Admin Area

## Screen 10 — Staff Login

Secure login.

Roles:
- Reception/Admin
- Doctor

Use role-based access.

---

## Screen 11 — Reception Dashboard

Main operational screen.

Show:

- Today's appointments
- Waiting
- Confirmed
- Checked In
- Completed
- Cancelled
- New patients

Appointment table:
- Token
- Patient
- Time
- Status
- Contact
- Action

Actions:
- Confirm
- Reschedule
- Cancel
- Check in
- Mark waiting
- Mark completed

---

## Screen 12 — Appointment Management

Features:
- Search
- Date filter
- Status filter
- Patient filter
- Appointment details
- Reschedule
- Cancel
- Status change
- Add walk-in

---

## Screen 13 — Patient Management

Features:
- Patient list
- Search by name/mobile/patient ID
- Add patient
- Open patient
- View appointment history

---

## Screen 14 — Patient Profile

Show only basic information needed for the demo.

- Name
- Phone
- Age
- Gender
- Patient ID
- Appointment history
- Previous visit dates
- Follow-up date
- Basic non-sensitive notes if required

Do NOT attempt to create a full electronic medical record.

---

# 10. Doctor Area

## Screen 15 — Doctor Dashboard

For Dr. Neela Singh.

Show:
- Today's appointments
- Waiting patients
- Completed visits
- Patient queue

The interface should be extremely simple.

---

## Screen 16 — Doctor Patient View

Show:
- Patient basic information
- Previous appointment history
- Previous visit notes if available
- Current appointment information

Doctor can:
- Add basic consultation note
- Add follow-up date
- Mark visit completed

Do NOT implement digital prescription in this demo.

---

# 11. Notifications

Notifications should focus on appointment operations.

Potential notification types:

- Appointment request received
- Appointment confirmed
- Appointment reminder
- Appointment rescheduled
- Appointment cancelled
- Follow-up reminder

For demo:
- Use simulated notifications/in-app notification UI.
- Do not connect paid WhatsApp/SMS services yet.

For production:
- WhatsApp/SMS can be added separately after the clinic approves the workflow and consent requirements.

---

# 12. Analytics

Simple management analytics only.

Show:
- Total appointments
- New patients
- Returning patients
- Completed appointments
- Cancelled appointments
- Pending appointments

Optional simple charts:
- Appointments by day
- New vs returning
- Appointment status distribution

Do not build advanced BI.

---

# 13. Languages

Default:
`English`

Available:
- English
- हिंदी
- भोजपुरी
- Hinglish

The UI language selector must be visible.

Example:

`English | हिंदी | भोजपुरी | Hinglish`

English must be:
- Simple
- Short
- Easy to understand
- Appropriate for users in Chapra/Saran

Avoid complex medical/technical English.

Translation architecture must use localization files, not hardcoded strings.

Example conceptual structure:

`locales/en.json`
`locales/hi.json`
`locales/bho.json`
`locales/hinglish.json`

Do not machine-translate medical claims blindly.

All Bhojpuri/Hinglish patient-facing content should be reviewed for natural local usage before production.

---

# 14. UI / UX DESIGN REQUIREMENTS

This is a high priority.

The demo must NOT look like a generic CRUD application.

It should look like a polished healthcare product.

## Design references

Study UX patterns from:
- Max Healthcare
- Medanta
- Apollo Hospitals
- Strong modern healthcare SaaS products

Do NOT copy their branding, exact layouts, copyrighted images, text, or design.

Extract principles:
- Clear CTA
- Strong trust signals
- Easy doctor discovery
- Simple appointment flow
- High-quality imagery
- Clear hierarchy
- Mobile-first navigation
- Accessibility
- Calm visual language

---

# 15. Visual Style

Desired personality:

`Trustworthy + Warm + Modern + Clean + Local`

Avoid:
- Excessive gradients
- Neon colors
- Overly futuristic AI visuals
- Excessive glassmorphism
- Too many cards
- Excessive shadows
- Corporate hospital clichés
- Generic stock-photo overload

The site should feel premium without feeling expensive or intimidating.

---

# 16. Color System

Use a healthcare-appropriate palette.

Prefer:
- Light background
- Deep trustworthy primary color
- Soft secondary tones
- Strong contrast for text
- Clear success/warning/error states

Do not choose colors randomly on every component.

Define a consistent design token system.

---

# 17. Typography

Use a highly readable modern font.

Requirements:
- Excellent Hindi/Devanagari support
- Good Latin support
- Good readability on low-resolution/mobile screens
- Clear heading hierarchy
- Large touch-friendly buttons

Use a font family with strong Hindi support such as an appropriate Google/Noto font if licensing/performance permits.

---

# 18. Animation

Animation is encouraged but must be subtle.

Use:
- Hero fade/reveal
- Gentle section reveal
- Card hover
- Button interaction
- Smooth page transitions
- Appointment progress indicator
- Small count-up animations for analytics
- Toast/notification animations

Do NOT:
- Animate everything
- Use distracting parallax
- Use looping medical illustrations everywhere
- Make important content wait several seconds before appearing

Respect `prefers-reduced-motion`.

---

# 19. Images / Media

Use real clinic imagery whenever possible.

Publicly available third-party photos may be used for research/reference, but do NOT assume we have permission to use them in the final production website.

Before production:
Request original assets from the clinic:
- Exterior
- Reception
- Waiting area
- Consultation room
- Facilities
- Doctor portrait
- Staff photos if desired
- Short clinic video if available

Do not use fake AI-generated photographs to represent the real doctor or real clinic.

If a real asset is unavailable:
- Use a tasteful placeholder in the demo.
- Clearly mark it for replacement.

---

# 20. Responsive Design

Must work well on:

- Mobile phones
- Tablets
- Laptops
- Desktop

Mobile is the priority.

Patient website should be designed mobile-first.

Reception/doctor dashboards should work on desktop/tablet and remain usable on smaller screens.

---

# 21. Accessibility

Implement basic accessibility:
- Semantic HTML
- Keyboard navigation
- Proper labels
- Good contrast
- Alt text
- Visible focus states
- Large touch targets
- Accessible forms
- Reduced-motion support

---

# 22. Security Requirements

Even though this starts as a demo, the architecture should not encourage unsafe practices.

Must include:
- Environment variables for secrets
- No API keys in frontend code
- Password hashing where passwords are used
- Secure authentication
- OTP expiry
- Rate limiting for OTP requests
- Role-based access
- Input validation
- Backend authorization checks
- HTTPS in deployment
- Basic logging
- Secure CORS configuration
- No real patient medical data in demo

IMPORTANT:
Do not put real patient information into development/test data.

Use fictional sample patients.

---

# 23. Data Model — Initial

Suggested collections/entities:

## Patient
- id
- name
- phone
- email (optional)
- age/date of birth
- gender
- address (optional)
- created_at

## Appointment
- id
- patient_id
- doctor_id
- date
- requested_time
- status
- reason
- token
- created_at
- updated_at

## Doctor
- id
- name
- qualifications
- specialization
- bio
- availability

## Staff/User
- id
- name
- phone/email
- role
- authentication metadata

## Visit
- id
- patient_id
- appointment_id
- doctor_id
- notes
- follow_up_date
- created_at

## Notification
- id
- patient_id
- appointment_id
- type
- status
- created_at

Keep the schema extensible but do not over-engineer it.

---

# 24. Demo Data

Create realistic fictional data.

Example:
- 10–20 sample patients
- Several appointments
- Different appointment statuses
- Example follow-ups
- Example analytics

Clearly label the environment as DEMO.

Never use real patient records.

---

# 25. Demo Workflow

The entire application should support this story:

Patient:

1. Opens Saran Nursing Home website
2. Sees doctor/services
3. Clicks Book Appointment
4. Enters mobile number
5. OTP verification
6. Selects date/time
7. Submits appointment
8. Receives confirmation
9. Views appointment status

Reception:

10. Logs in
11. Sees appointment
12. Confirms it
13. Patient arrives
14. Reception marks Checked In / Waiting
15. Doctor sees patient in dashboard

Doctor:

16. Opens patient
17. Reviews basic previous visit information
18. Adds basic consultation note
19. Adds follow-up date
20. Marks visit completed

Management:

21. Dashboard statistics update.

This workflow is the primary demo narrative.

---

# 26. Explicitly OUT OF SCOPE

Do NOT build these in the initial demo:

- Digital prescription
- Full EMR/EHR
- Pharmacy
- Billing/accounting
- Lab management
- Inventory
- Insurance processing
- Hospital admission/discharge
- Android app
- iOS app
- AI diagnosis
- Medical advice chatbot
- RAG
- Complex AI
- Payment gateway
- Live WhatsApp API
- Paid SMS/OTP integration
- Advanced BI
- Multi-hospital support
- Multi-doctor complexity beyond what the real clinic requires
- ICU/emergency management
- Medical device integration

These may become future phases.

---

# 27. Important Business Rule

The platform must not make unsupported medical claims.

Never write:
- "Best hospital in Chapra"
- "No. 1 doctor"
- "Guaranteed treatment"
- "100% success"
- "Advanced treatment" unless verified
- Any invented patient outcome

Use factual, client-approved information.

---

# 28. Content Strategy

Content should be:
- Short
- Human
- Trustworthy
- Local
- Easy to scan
- Patient-focused

Instead of:
`Schedule your consultation with our esteemed medical practitioner`

Use:
`Book an Appointment`

Instead of:
`Access our comprehensive healthcare ecosystem`

Use:
`Find the care and information you need.`

---

# 29. SEO / Discoverability — Demo Level

Implement basic:
- Page titles
- Meta descriptions
- Open Graph metadata
- Local business structured data where appropriate
- Sitemap
- Robots configuration

Do not over-invest in SEO during the demo.

---

# 30. Performance

Target:
- Fast initial load
- Optimized images
- Lazy loading
- Responsive images
- Minimal JavaScript where possible
- No unnecessary libraries
- Lighthouse-oriented optimization

Avoid heavy animation libraries unless needed.

---

# 31. Error / Empty States

Every major flow needs:
- Loading state
- Empty state
- Error state
- Success state

Examples:
`No appointments today`
`Unable to load appointments`
`Appointment submitted successfully`

Never leave blank screens.

---

# 32. Deployment

For the first deployment, use simple managed services.

Conceptual setup:

Frontend:
`React/Vite → managed frontend hosting`

Backend:
`FastAPI → managed application hosting`

Database:
`MongoDB Atlas`

Domain:
`Clinic-owned domain`

HTTPS:
`Managed SSL`

Do not expose secrets.

The developer/Claude Code should document:
- Build command
- Start command
- Environment variables
- Database setup
- Deployment steps
- Domain/DNS setup
- Rollback/redeployment procedure

---

# 33. Development Method

Use an incremental approach.

Do NOT attempt to build everything at once.

Recommended sequence:

### Phase A
Project setup + design system + public website

### Phase B
Authentication + appointment flow

### Phase C
Reception dashboard

### Phase D
Patient management

### Phase E
Doctor dashboard

### Phase F
Notifications + analytics

### Phase G
Testing + responsive polish

### Phase H
Deployment preparation

---

# 34. Claude Code Instructions

Claude Code should:

1. Read this entire file before coding.
2. Inspect the existing repository before changing anything.
3. Create a clear project structure.
4. Maintain a `PROJECT_STATUS.md` or equivalent progress file.
5. Maintain a `DECISIONS.md` file for important architectural decisions.
6. Do not silently expand scope.
7. Ask before implementing major out-of-scope features.
8. Do not use real patient data.
9. Do not hardcode secrets.
10. Use `.env.example`.
11. Keep frontend/backend responsibilities separated.
12. Build reusable components.
13. Use localization files.
14. Make mobile responsiveness a first-class requirement.
15. Test each feature before moving to the next phase.
16. Fix errors rather than hiding them.
17. Avoid unnecessary dependencies.
18. Keep code understandable to a developer who is learning deployment and backend engineering.
19. Document all commands required to run the project.
20. At the end of each major phase, summarize:
   - What was completed
   - What was tested
   - Known issues
   - Next recommended task

---

# 35. Demo Quality Bar

The demo is successful if a non-technical clinic owner can understand it without a technical explanation.

A person should be able to look at it and understand:

`This is our clinic`
`This is our doctor`
`This is how a patient books`
`This is what reception sees`
`This is what the doctor sees`
`This is how the appointment progresses`

The application should feel like a real product, not a coding exercise.

---

# 36. Final Acceptance Criteria

Before showing the demo to the client:

- All primary screens work.
- Appointment flow works end-to-end.
- Login works.
- Role-based access works.
- Reception dashboard updates correctly.
- Patient records can be searched.
- Doctor dashboard works.
- Appointment statuses work.
- Language switching works.
- Mobile UI works.
- No broken links/buttons.
- No console errors in normal use.
- No secrets exposed.
- No real patient data.
- Images are optimized.
- Loading/error/empty states exist.
- Demo data is realistic.
- Application is visually polished.
- Deployment instructions are documented.

---

# 37. Important Principle

The goal is NOT to build the biggest system possible.

The goal is:

> **Build a small, polished, believable digital patient-access platform that makes Saran Nursing Home's existing physical workflow easier without forcing the clinic to abandon it.**

A smaller product that feels real is better than a huge unfinished hospital ERP.

---

# 38. Future Possibilities — DO NOT BUILD NOW

If the client likes the demo, future phases may include:

- Real WhatsApp notifications
- Real SMS OTP
- Patient mobile app
- Online reports
- Digital document access
- Advanced appointment queue
- Follow-up automation
- Billing
- Pharmacy
- Lab workflows
- AI administrative assistant
- Multilingual WhatsApp assistant
- Advanced analytics

These are future opportunities and should not be included in the initial demo codebase unless explicitly approved.

---

# 39. Project Success

The technical goal is:

**A working demo.**

The business goal is:

**Get the clinic owner to understand the value and agree to test the platform in the real clinic environment.**

Therefore prioritize:
1. Patient experience
2. Appointment workflow
3. Reception usability
4. Trust
5. Visual quality
6. Mobile experience
7. Reliability
8. Simplicity

Do not prioritize feature count.

---

# END OF PROJECT SCOPE


---

# 40. Mandatory Milestone & Stage Development Process

The project MUST be developed in **3 Milestones**, and each Milestone MUST contain exactly **3 Stages**.

Total:

**3 Milestones × 3 Stages = 9 Development Stages**

Claude Code MUST NOT treat the project as one continuous autonomous coding task.

## Critical Rule: Confirmation Gate

Before starting EVERY new stage:

1. Stop development.
2. Briefly explain what was completed in the previous stage.
3. List the screens/features that were developed.
4. Mention what was tested.
5. Mention any known issues or decisions.
6. Explain exactly what the next stage will build.
7. Ask the user for explicit confirmation.
8. Do NOT begin the next stage until the user confirms.

The user may say:
- `Proceed`
- `Continue`
- `Start Stage X`
- Or provide changes before approving.

If the user requests changes, implement those changes first and then ask for confirmation again.

### IMPORTANT

Do NOT ask for confirmation between every small coding task inside a stage.

The confirmation gate is required **between stages only**.

Within an approved stage, Claude Code may complete the stage's planned tasks autonomously while following the scope.

---

# 41. Milestone 1 — Public Patient Experience

## Goal

Build the polished public-facing website and the complete patient appointment journey.

The end result should already look like a convincing healthcare website that can be shown to the clinic owner.

---

## Stage 1.1 — Project Foundation & Design System

Build:

- React/Vite project foundation
- Tailwind/design system
- Global layout
- Typography
- Color tokens
- Buttons
- Cards
- Forms
- Header/navigation
- Footer
- Responsive foundation
- Localization architecture
- English/Hindi/Bhojpuri/Hinglish language structure
- Basic routing
- Reusable UI components
- Placeholder/demo asset structure

Screens/components introduced:

- Global Header
- Global Footer
- Navigation
- Language Selector
- Mobile Navigation
- Design-system components

Testing:

- Application starts correctly
- Responsive layout works
- Language switching architecture works
- No console errors
- Basic accessibility checks

### STOP HERE

After Stage 1.1, Claude Code MUST provide:

**Completed**
- What was built

**Screens/components**
- List of screens/components

**Testing**
- What was tested

**Issues**
- Known issues

**Next**
- What Stage 1.2 will build

Then ask:

> **"Stage 1.1 is complete. Would you like me to proceed to Stage 1.2?"**

Do not start Stage 1.2 without confirmation.

---

## Stage 1.2 — Public Website

Build:

### Home
- Hero
- Hospital introduction
- Dr. Neela Singh highlight
- Services preview
- Appointment CTA
- Contact CTA
- Location preview

### About
- Hospital information
- Facilities/content
- Approved imagery/placeholders

### Doctor
- Dr. Neela Singh profile
- Verified information only
- Appointment CTA

### Services
- Verified service cards
- Service details
- Appointment CTA

### Contact / Find Us
- Verified contact
- Location
- Map
- Call
- WhatsApp

### Before Your Visit
- Patient preparation information
- Clinic-approved guidance

Design requirements:
- Premium healthcare appearance
- Warm/local feeling
- High-quality imagery
- Subtle animations
- Mobile-first
- Clear CTA placement

### STOP HERE

Before Stage 1.3, provide:
- What was developed
- Screen-by-screen summary
- What information is placeholder / needs client confirmation
- Animation/UI summary
- Testing summary
- Known issues

Then ask for explicit confirmation.

---

## Stage 1.3 — Patient Authentication & Appointment Journey

Build:

### Patient login
- Mobile number
- OTP
- Optional email
- Demo OTP mechanism

### Appointment booking
- Doctor
- Date
- Time/requested time
- Patient information
- Reason for visit
- Submit

### Confirmation
- Appointment/request ID
- Doctor
- Date
- Time
- Status
- Contact options

### My Appointments
- Upcoming
- Previous
- Status

Appointment statuses:
- Request Submitted
- Confirmed
- Checked In
- Waiting
- Completed
- Cancelled

Test complete flow:

**Home → Doctor → Book → OTP → Appointment → Confirmation → My Appointments**

### STOP HERE

Before Milestone 2:
- Briefly explain the complete patient experience now available.
- List all patient-facing screens.
- Explain what is functional vs simulated.
- Test the entire appointment journey.
- Ask for confirmation to begin Milestone 2.

---

# 42. Milestone 2 — Clinic Operations

## Goal

Connect the patient-facing system to the clinic's reception and doctor workflows.

---

## Stage 2.1 — Staff Authentication & Reception Foundation

Build:

### Staff login
- Reception/Admin role
- Secure authentication
- Role-based access

### Reception Dashboard foundation
- Today's overview
- Appointment list
- Status indicators
- Search/filter

### Appointment management
- Confirm
- Cancel
- Reschedule
- Check in
- Waiting
- Completed

### Walk-in registration

Reception should be able to create a walk-in appointment/patient.

### STOP HERE

Before Stage 2.2:
- Explain what reception can now do.
- Show the screens developed.
- Briefly explain the appointment lifecycle.
- Report testing and known issues.
- Ask for explicit confirmation.

---

## Stage 2.2 — Patient Management

Build:

### Patient list
- Search
- Filter
- Add patient
- Patient ID

### Patient profile
- Basic details
- Appointment history
- Previous visits
- Follow-up date
- Basic notes where appropriate

Connect:

**Appointment → Patient**

so a booking automatically creates/links to the appropriate patient record.

### STOP HERE

Before Stage 2.3:
- Explain the patient-management workflow.
- List new screens.
- Demonstrate patient creation/search/history.
- Explain what data is stored.
- Report testing.
- Ask for confirmation.

---

## Stage 2.3 — Doctor Dashboard & Visit Workflow

Build specifically around:

**Dr. Neela Singh**

Do not introduce unnecessary multi-doctor complexity.

### Doctor Dashboard
- Today's appointments
- Waiting patients
- Completed patients
- Patient queue

### Patient View
- Basic patient information
- Previous appointments
- Previous visit notes
- Current appointment

### Visit workflow
- Open patient
- Add basic consultation note
- Add follow-up date
- Mark visit completed

Do NOT build digital prescription.

### STOP HERE

Before Milestone 3:
- Demonstrate the complete clinic workflow.
- Explain what the doctor can see/do.
- Explain what reception can see/do.
- Test:

**Patient → Reception → Check-in → Waiting → Doctor → Completed**

- List known issues.
- Ask for explicit confirmation before Milestone 3.

---

# 43. Milestone 3 — Polish, Communication & Client Demo

## Goal

Turn the functional application into a polished, convincing client demonstration and deployment-ready product.

---

## Stage 3.1 — Notifications & Analytics

Build:

### Notification system
Demo/in-app notifications for:
- Appointment submitted
- Appointment confirmed
- Appointment reminder
- Appointment rescheduled
- Appointment cancelled
- Follow-up reminder

For this stage:
- Simulate WhatsApp/SMS where necessary.
- Do NOT integrate paid WhatsApp/SMS APIs.

### Analytics
- Total appointments
- New patients
- Returning patients
- Completed
- Cancelled
- Pending
- Basic appointment trends
- New vs returning

### STOP HERE

Before Stage 3.2:
- Explain notifications.
- Explain analytics.
- Show screens.
- Confirm that external messaging is simulated.
- Test dashboard calculations.
- Ask for confirmation.

---

## Stage 3.2 — UI/UX Polish, Localization & Quality

Perform full product polish.

### UI
- Typography refinement
- Spacing
- Responsive layouts
- Mobile navigation
- CTA consistency
- Form polish
- Empty states
- Loading states
- Error states
- Success states

### Animation
- Hero reveal
- Section reveal
- Button interactions
- Card hover
- Page transitions
- Appointment progress
- Analytics count-up

Rules:
- Keep animations subtle.
- No excessive motion.
- Respect `prefers-reduced-motion`.

### Languages
Complete and test:
- English
- Hindi
- Bhojpuri
- Hinglish

Ensure no hardcoded UI strings remain.

### Accessibility
- Keyboard navigation
- Labels
- Focus states
- Contrast
- Alt text
- Touch targets

### Performance
- Image optimization
- Lazy loading
- Bundle review
- Remove unnecessary dependencies

### STOP HERE

Before Stage 3.3:
- Give a screen-by-screen quality review.
- Test all four languages.
- Test mobile/tablet/desktop.
- Report accessibility/performance issues.
- Ask for confirmation.

---

## Stage 3.3 — Final Testing, Deployment Preparation & Client Demo

Perform final end-to-end testing.

### Test:
- Patient registration
- OTP
- Appointment
- Confirmation
- Reception
- Patient management
- Doctor workflow
- Notifications
- Analytics
- Language switching
- Responsive design
- Error states
- Authentication
- Role permissions

### Security review
- Environment variables
- No exposed secrets
- CORS
- Authentication
- Authorization
- Input validation
- OTP protections
- Demo data only

### Deployment preparation
Prepare:
- Production environment configuration
- `.env.example`
- Database configuration
- Frontend build
- Backend build
- Deployment documentation
- Domain/DNS instructions
- HTTPS
- Backup considerations

### Client demo preparation

Create a simple demonstration flow:

1. Open website
2. Show hospital
3. Show Dr. Neela Singh
4. Book appointment
5. Show confirmation
6. Login as reception
7. Show appointment
8. Check patient in
9. Login as doctor
10. Open patient
11. Add visit note/follow-up
12. Mark completed
13. Show analytics
14. Show language switching

### STOP

Before any real production deployment or use of real patient data:

Claude Code MUST ask for explicit user confirmation.

---

# 44. Stage Completion Report Format

At the end of EVERY stage, Claude Code MUST use this structure:

## Stage Completed
`Milestone X — Stage X.X`

### What I Built
Short summary.

### Screens Developed
- Screen 1
- Screen 2
- Screen 3

### Functionality
- Feature 1
- Feature 2
- Feature 3

### What I Tested
- Test 1
- Test 2
- Test 3

### Current Status
`Ready for review / Issues found`

### Known Issues
- Issue 1
- Issue 2

### Next Stage
Short explanation of what will be developed next.

### Confirmation Required
> **The current stage is complete. Please review the above summary. Shall I proceed to the next stage?**

Claude Code MUST WAIT after this message.

---

# 45. User Control Rule

The user remains the decision-maker throughout development.

Claude Code must NOT:
- Automatically start the next stage.
- Expand the scope without approval.
- Add major features because they "would be useful."
- Purchase services.
- Deploy to production without confirmation.
- Connect paid APIs without confirmation.
- Use real patient information without explicit approval.
- Replace the agreed architecture without explaining why.

If a technical problem requires changing the scope or architecture:
1. Stop.
2. Explain the problem.
3. Explain the proposed solution.
4. Explain the impact.
5. Ask for confirmation.

---

# 46. Milestone Summary

## MILESTONE 1 — Patient Experience

### Stage 1.1
Foundation + Design System

### Stage 1.2
Public Website

### Stage 1.3
Authentication + Appointment Journey

**Result:**
A patient can discover the clinic and complete an appointment workflow.

---

## MILESTONE 2 — Clinic Operations

### Stage 2.1
Reception + Appointment Management

### Stage 2.2
Patient Management

### Stage 2.3
Doctor Dashboard + Visit Workflow

**Result:**
The appointment created by a patient flows through reception to the doctor.

---

## MILESTONE 3 — Polish + Demonstration

### Stage 3.1
Notifications + Analytics

### Stage 3.2
UI/UX + Localization + Quality

### Stage 3.3
Final Testing + Deployment Preparation + Client Demo

**Result:**
A polished, convincing, deployment-ready demonstration.

---

# 47. Approximate Development Sequence

The sequence should generally be:

`M1S1 → confirmation → M1S2 → confirmation → M1S3 → confirmation`

then:

`M2S1 → confirmation → M2S2 → confirmation → M2S3 → confirmation`

then:

`M3S1 → confirmation → M3S2 → confirmation → M3S3`

The developer may take longer within a stage if necessary to properly complete and test it.

Quality is more important than rushing to the next stage.

---

# 48. Final Instruction to Claude Code

**Do not start by building the entire application.**

Start with:

> **Milestone 1 — Stage 1.1: Project Foundation & Design System**

Read this entire `project_scope.md` first.

After Stage 1.1 is complete, stop and ask the user for confirmation.

Continue this confirmation-gated process for all 9 stages.

