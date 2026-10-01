/**
 * End-to-end patient journey (Stage 1.3):
 *   Home → Doctor → Book → OTP → Day & time → Details → Submit → Confirmation → My Appointments
 *
 * Needs a backend on a TEST database and the preview server pointing at it:
 *   (backend)  MONGODB_DB=saran_e2e OTP_PER_IP_PER_HOUR=1000 OTP_VERIFY_PER_IP_PER_HOUR=1000 FIXED_CLOCK_HOUR=9 STAFF_LOGIN_PER_IP_PER_HOUR=1000 \
 *              .venv/bin/uvicorn app.main:app --port 8011
 *   (frontend) npm run build && API_TARGET=http://localhost:8011 npm run preview
 *   (frontend) npm run test:journey
 *
 * Uses a random mobile number each run, so it can be re-run without cleaning the database.
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const SHOTS = process.env.SCREENSHOTS
if (SHOTS) mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome' })
const results = []
const log = (ok, msg) => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`)
}
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })
// Wait (up to 8 s) for something to appear — pages render after the session check finishes.
const seen = (locator, timeout = 8000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const randomPhone = () => `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`

async function newPhonePage() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return { ctx, page, errors }
}

/** After a correct code, a new number sees the registration form; fill it in. */
async function registerIfNew(page, name = 'Anita Kumari', age = '31') {
  const form = page.getByRole('button', { name: 'Create account & verify' })
  if (!(await form.waitFor({ timeout: 4000 }).then(() => true, () => false))) return false
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Gender').selectOption('female')
  await page.getByLabel('Age', { exact: true }).fill(age)
  await form.click()
  return true
}

async function loginWithOtp(page, phone) {
  await page.getByLabel('Mobile number').fill(phone)
  await page.getByRole('button', { name: 'Send code' }).click()
  const demo = page.getByText('Your code is')
  await demo.waitFor()
  const code = (await demo.locator('strong').textContent()).trim()
  await page.getByLabel('Enter the 6-digit code').fill(code)
  await page.getByRole('button', { name: 'Verify & continue' }).click()
  await registerIfNew(page)
  return code
}

// ---- 1. Full happy path on a phone -------------------------------------------------------------
const phone = randomPhone()
let requestId
{
  const { ctx, page, errors } = await newPhonePage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Doctor' }).click()
  await page.waitForURL('**/doctor')
  await page.locator('main').getByRole('link', { name: 'Book Appointment' }).first().click()
  await page.waitForURL('**/book')
  log(await seen(page.getByRole('heading', { name: 'Your mobile' })), 'guest starts booking at "Your mobile" step')
  await shot(page, 'j1-mobile')

  // Wrong code first
  await page.getByLabel('Mobile number').fill(phone)
  await page.getByRole('button', { name: 'Send code' }).click()
  await page.getByText('Your code is').waitFor()
  const code = (await page.getByText('Your code is').locator('strong').textContent()).trim()
  await shot(page, 'j2-otp')
  const wrong = code === '000000' ? '111111' : '000000'
  await page.getByLabel('Enter the 6-digit code').fill(wrong)
  await page.getByRole('button', { name: 'Verify & continue' }).click()
  const wrongMsg = page.getByText('Wrong code. 4 tries left.')
  await wrongMsg.waitFor({ timeout: 5000 }).catch(() => {})
  log(await wrongMsg.isVisible(), 'wrong OTP shows "Wrong code. 4 tries left."')
  await page.getByLabel('Enter the 6-digit code').fill(code)
  await page.getByRole('button', { name: 'Verify & continue' }).click()
  log(await seen(page.getByText('This number is new to us')), 'new number is asked for details only after the correct code')
  await page.getByRole('button', { name: 'Create account & verify' }).click()
  log(await seen(page.getByText('Please choose one.')), 'registration: gender must be chosen (placeholder is not a value)')
  log(await registerIfNew(page), 'registration form submits (name, gender, age)')

  await page.getByRole('heading', { name: 'Day & time' }).waitFor()
  log(true, 'correct OTP moves to "Day & time"')
  log((await page.locator('[name=booking-date]').count()) === 8, 'patients can pick today + the next 7 days only (8 days)')
  log(await seen(page.getByText('The doctor sees patients from 10 AM to 4 PM')), 'booking explains the 10 AM – 4 PM hours and 7-day limit')
  log((await page.locator('[name=booking-slot]').count()) === 3, 'three time windows inside 10 AM – 4 PM')
  log(await seen(page.getByText('Dr. Neela Singh', { exact: true })), 'doctor pre-selected (Dr. Neela Singh)')

  await page.getByRole('button', { name: 'Continue' }).click()
  log(
    (await seen(page.getByText('Please choose a day.'))) && (await seen(page.getByText('Please choose a time.'))),
    'continue without day/time shows both errors',
  )
  await page.locator('label', { hasText: 'Tomorrow' }).click()
  await page.locator('label', { hasText: '10 AM – 12 PM' }).click()
  await shot(page, 'j3-when')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('heading', { name: 'Your details' }).waitFor()
  log((await page.getByLabel('Full name').inputValue()) === 'Anita Kumari', 'details pre-filled from registration')
  await page.getByLabel('Full name').fill('')
  await page.getByRole('button', { name: 'Continue' }).click()
  log(await seen(page.getByText('Please fill this in.')), 'empty name shows an error')
  await page.getByLabel('Full name').fill('Anita Kumari')
  await page.getByLabel('Age', { exact: true }).fill('31')
  await page.locator('label', { hasText: 'Female' }).click()
  await page.getByLabel(/Reason for visit/).fill('Regular check-up')
  await shot(page, 'j4-details')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('heading', { name: 'Check & send' }).waitFor()
  const review = await page.locator('dl').textContent()
  log(
    ['Dr. Neela Singh', '10 AM – 12 PM', 'Anita Kumari', `+91 ${phone}`, 'Regular check-up'].every((s) => review.includes(s)),
    'review step shows doctor, time, patient, mobile and reason',
  )
  await shot(page, 'j5-review')
  await page.getByRole('button', { name: 'Send Appointment Request' }).click()

  await page.getByRole('heading', { name: 'Appointment Request Submitted' }).waitFor()
  requestId = (await page.locator('.font-mono').first().textContent()).trim()
  log(/^SNH-[2-9A-HJ-NP-Z]{6}$/.test(requestId), `confirmation shows request ID ${requestId}`)
  log(await seen(page.getByText('Request Submitted').first()), 'status shows "Request Submitted"')
  const wa = await page.getByRole('link', { name: 'WhatsApp' }).first().getAttribute('href')
  log(wa.includes(requestId), 'WhatsApp message includes the request ID')
  await page.waitForTimeout(600)
  await shot(page, 'j6-confirmation')

  await page.locator('main').getByRole('link', { name: 'My Appointments' }).click()
  await page.waitForURL('**/my-appointments')
  await page.getByRole('heading', { name: 'Upcoming' }).waitFor()
  log(await seen(page.getByText(requestId)), 'My Appointments lists the new request under Upcoming')
  log(await seen(page.getByText('Hello, Anita Kumari')), 'My Appointments greets the patient by name (profile synced after booking)')
  await page.waitForTimeout(600)
  await shot(page, 'j7-my-appointments')

  // Book again for the same day → friendly duplicate message
  await page.goto(BASE + '/book', { waitUntil: 'networkidle' })
  log(await seen(page.getByRole('heading', { name: 'Day & time' })), 'logged-in patient skips the mobile step')
  await page.locator('label', { hasText: 'Tomorrow' }).click()
  await page.locator('label', { hasText: '2 – 4 PM' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  log((await page.getByLabel('Full name').inputValue()) === 'Anita Kumari', 'details pre-filled from profile')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Send Appointment Request' }).click()
  const dup = page.getByText('You already have an appointment request for this day.')
  await dup.waitFor({ timeout: 5000 }).catch(() => {})
  log(await dup.isVisible(), 'same-day duplicate shows a clear message')

  // Service page → booking reason pre-filled
  await page.goto(BASE + '/services/pregnancy-care', { waitUntil: 'networkidle' })
  await page.locator('main').getByRole('link', { name: 'Book Appointment' }).first().click()
  await page.locator('label', { hasText: '10 AM – 12 PM' }).waitFor()
  await page.locator('[name=booking-date]').nth(3).locator('..').click()
  await page.locator('label', { hasText: '10 AM – 12 PM' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  log((await page.getByLabel(/Reason for visit/).inputValue()) === 'Pregnancy care', 'booking from a service pre-fills the reason')

  // Logout → protected pages redirect to login
  await page.goto(BASE + '/my-appointments', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Log out' }).click()
  await page.waitForTimeout(1500) // let any redirect settle
  log(page.url() === BASE + '/', `logout lands on the home page (not the login screen) → ${page.url()}`)
  // In-app: after logout, My Appointments must ask to log in again (not send home again).
  await page.locator('footer').getByRole('link', { name: 'My Appointments' }).click()
  await page.waitForURL('**/login?next=**', { timeout: 8000 }).catch(() => {})
  log(page.url().includes('/login?next='), 'after logout, footer "My Appointments" asks to log in')
  await page.goto(BASE + '/my-appointments', { waitUntil: 'networkidle' })
  await page.waitForURL('**/login?next=**', { timeout: 8000 }).catch(() => {})
  log(page.url().includes('/login?next=%2Fmy-appointments'), 'after logout, My Appointments redirects to login')

  const unexpected = errors.filter((e) => !/status of (400|409)/.test(e)) // expected: wrong OTP, duplicate
  log(unexpected.length === 0, `no unexpected console errors${unexpected.length ? ' → ' + unexpected.join(' | ') : ''}`)
  await ctx.close()
}

// ---- 2. Returning patient: login page → back to the page they wanted --------------------------
{
  const { ctx, page, errors } = await newPhonePage()
  await page.goto(BASE + `/appointments/${requestId}`, { waitUntil: 'networkidle' })
  await page.waitForURL('**/login?next=**', { timeout: 8000 }).catch(() => {})
  log(page.url().includes('/login?next='), 'guest opening an appointment link is asked to log in')
  await shot(page, 'j8-login')
  await page.waitForTimeout(31000) // resend cooldown for the same number
  await loginWithOtp(page, phone)
  await page.waitForURL(`**/appointments/${requestId}`)
  log(await seen(page.getByRole('heading', { name: 'Appointment details' })), 'after login, returns to that appointment')
  log(errors.length === 0, `no console errors${errors.length ? ' → ' + errors.join(' | ') : ''}`)
  await ctx.close()
}

// ---- 3. Another patient cannot open this appointment -----------------------------------------
{
  const { ctx, page } = await newPhonePage()
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await loginWithOtp(page, randomPhone())
  await page.waitForURL('**/my-appointments')
  const empty = page.getByText('No upcoming appointments')
  await empty.waitFor({ timeout: 5000 }).catch(() => {})
  log(await empty.isVisible(), 'new patient sees the empty state')
  await page.goto(BASE + `/appointments/${requestId}`, { waitUntil: 'networkidle' })
  log(await seen(page.getByText('We could not find this appointment.')), "other patient's appointment is not visible")
  await ctx.close()
}

// ---- 4. Hindi booking flow labels ---------------------------------------------------------------
{
  const { ctx, page } = await newPhonePage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.setItem('snh.language', 'hi'))
  await page.goto(BASE + '/book', { waitUntil: 'networkidle' })
  log(await seen(page.getByRole('heading', { name: 'अपॉइंटमेंट बुक करें' })), 'booking page in Hindi')
  log(await seen(page.getByText('चरण 1 / 4')), 'Hindi step indicator "चरण 1 / 4"')
  await shot(page, 'j9-hindi')
  await ctx.close()
}

await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
