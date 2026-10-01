/**
 * Stage 2.1 end-to-end: patient books online → reception confirms → checks in (token) → waiting →
 * completed, plus reschedule, cancel, walk-ins, role separation, logout, Hindi and phone layout.
 *
 * Needs the same setup as test:journey (test backend on 8011 + preview on 4180):
 *   (backend)  MONGODB_DB=saran_e2e OTP_PER_IP_PER_HOUR=1000 OTP_VERIFY_PER_IP_PER_HOUR=1000 \
 *              .venv/bin/uvicorn app.main:app --port 8011
 *   (frontend) npm run build && API_TARGET=http://localhost:8011 npm run preview
 *   (frontend) npm run test:reception
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
const seen = (locator, timeout = 8000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })
const run = Math.random().toString(36).slice(2, 6).toUpperCase()
const randomPhone = () => `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`

// ---- Patient side through the public API (same calls the website makes) --------------------------
async function patientBooks(name, dayOffset, slot = 'morning') {
  const phone = randomPhone()
  const post = async (path, body, cookie) => {
    const res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
      body: JSON.stringify(body),
    })
    return { res, data: await res.json().catch(() => null) }
  }
  const { data: otp } = await post('/auth/otp/request', { phone })
  const { res } = await post('/auth/otp/verify/register', { phone, code: otp.demo_code, name, age: 30, gender: 'female' })
  const cookie = res.headers.get('set-cookie').split(';')[0]
  const options = await (await fetch(`${BASE}/api/booking/options`)).json()
  const date = options.dates[dayOffset]
  const { data } = await post('/appointments', { date, time_slot: slot, name, age: 30, gender: 'female' }, cookie)
  return { rid: data.request_id, cookie, date, phone }
}
const patientStatus = async (b) =>
  (await (await fetch(`${BASE}/api/appointments/${b.rid}`, { headers: { Cookie: b.cookie } })).json()).status

async function staffPage(viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return { ctx, page, errors }
}

async function staffLogin(page, role = 'reception') {
  await page.goto(BASE + '/staff', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: new RegExp(`${role}123`) }).click()
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
}

const row = (page, text) => page.locator('tbody tr', { hasText: text })
async function search(page, text) {
  await page.getByLabel('Search appointments').fill(text)
  await page.waitForTimeout(700) // debounce + request
}
const toast = (page, text) => seen(page.getByRole('status').filter({ hasText: text }), 6000)
// Status badges: exact text, so "Completed" doesn't also match the "Mark completed" button.
const badge = (r, text) => seen(r.getByText(text, { exact: true }))
/** Poll until fn() is truthy (the list refreshes a moment after each action). */
async function eventually(fn, timeout = 8000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const value = await fn()
    if (value) return value
    await new Promise((r) => setTimeout(r, 200))
  }
  return fn()
}

// ---- 1. Full visit lifecycle -------------------------------------------------------------------
const today = await patientBooks(`Kiran ${run}`, 0)
const later = await patientBooks(`Lata ${run}`, 2)
const toCancel = await patientBooks(`Mala ${run}`, 1)
{
  const { ctx, page, errors } = await staffPage()
  await page.goto(BASE + '/staff', { waitUntil: 'networkidle' })
  log(page.url().endsWith('/staff/login'), 'staff area requires login')
  log(await seen(page.getByText('Demo accounts')), 'login page lists demo accounts (demo mode)')
  await page.getByRole('button', { name: /reception123/ }).click()
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  log(await seen(page.getByRole('heading', { name: 'Reception' })), 'reception logs in and sees the dashboard')

  await search(page, `Kiran ${run}`)
  const r = row(page, `Kiran ${run}`)
  log(await badge(r, 'Request Submitted'), "patient's online booking appears as Request Submitted")
  await shot(page, 'r1-dashboard')

  await r.getByRole('button', { name: 'Confirm' }).click()
  log(await toast(page, `Kiran ${run} confirmed`), 'Confirm → toast')
  log(await badge(r, 'Confirmed'), 'status becomes Confirmed')
  log((await patientStatus(today)) === 'confirmed', "patient's own page shows Confirmed")

  await r.getByRole('button', { name: 'Check in' }).click()
  log(await toast(page, 'checked in — token'), 'Check in → toast with token')
  const token = await eventually(async () => Number((await r.locator('td').first().textContent()).trim()))
  log(token >= 1, `token shown in the list (${token})`)

  await r.getByRole('button', { name: 'Mark waiting' }).click()
  log(await badge(r, 'Waiting'), 'Mark waiting → Waiting')
  await r.getByRole('button', { name: 'Mark completed' }).click()
  log(await badge(r, 'Completed'), 'Mark completed → Completed')
  log(await eventually(async () => (await r.getByRole('button', { name: /Confirm|Check in|Mark/ }).count()) === 0), 'no more actions on a completed visit')
  log((await patientStatus(today)) === 'completed', "patient's own page shows Completed")

  await r.getByRole('button', { name: /^Details/ }).click()
  const dialog = page.getByRole('dialog')
  const history = await dialog.locator('ol').textContent()
  log(['Request Submitted', 'Confirmed', 'Checked In', 'Waiting', 'Completed'].every((s) => history.includes(s)), 'details show the full history')
  log(history.includes('by reception'), 'history records who made each change')
  await shot(page, 'r2-details')
  await page.keyboard.press('Escape')
  log(!(await dialog.isVisible()), 'Esc closes the dialog')

  // ---- 2. Reschedule a future request from the New requests tab
  await page.getByRole('tab', { name: /New requests/ }).click()
  await search(page, `Lata ${run}`)
  await row(page, `Lata ${run}`).getByRole('button', { name: /^Details/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Reschedule' }).click()
  const re = page.getByRole('dialog')
  await re.locator('[name=booking-date]').nth(4).locator('..').click()
  await re.locator('label', { hasText: 'Evening' }).click()
  await shot(page, 'r3-reschedule')
  await re.getByRole('button', { name: 'Save new time' }).click()
  log(await toast(page, `Lata ${run} moved to`), 'Reschedule → toast')
  log((await patientStatus(later)) === 'confirmed', 'rescheduled appointment is Confirmed for the patient')

  // ---- 3. Cancel with a reason
  await search(page, `Mala ${run}`)
  await row(page, `Mala ${run}`).getByRole('button', { name: /^Details/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('dialog').getByLabel(/Reason/).fill('Patient called to cancel')
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel' }).click()
  log(await toast(page, `Mala ${run}'s appointment is cancelled`), 'Cancel → toast')
  log((await patientStatus(toCancel)) === 'cancelled', 'patient sees Cancelled')

  // ---- 4. Walk-in: validation, create, duplicate
  await page.getByRole('tab', { name: 'Day list' }).click()
  await page.getByRole('button', { name: 'Add walk-in' }).first().click()
  const w = page.getByRole('dialog')
  await w.getByRole('button', { name: 'Add and check in' }).click()
  log(await seen(w.getByText('Please enter a valid 10-digit mobile number.')), 'walk-in form validates')
  const walkPhone = randomPhone()
  await w.getByLabel('Mobile number').fill(walkPhone)
  await w.getByLabel('Full name').fill(`Walkin ${run}`)
  await w.getByLabel('Age', { exact: true }).fill('52')
  await w.locator('label', { hasText: 'Female' }).click()
  await w.getByLabel(/Reason/).fill('Back pain')
  await shot(page, 'r4-walkin')
  await w.getByRole('button', { name: 'Add and check in' }).click()
  log(await toast(page, `Walkin ${run} added — token`), 'walk-in added and checked in with a token')
  await search(page, `Walkin ${run}`)
  const wr = row(page, `Walkin ${run}`)
  log((await badge(wr, 'Checked In')) && (await seen(wr.getByText('Walk-in'))), 'walk-in listed as Checked In, tagged Walk-in')

  await page.getByRole('button', { name: 'Add walk-in' }).first().click()
  await w.getByLabel('Mobile number').fill(walkPhone)
  await w.getByLabel('Full name').fill(`Walkin ${run}`)
  await w.getByLabel('Age', { exact: true }).fill('52')
  await w.locator('label', { hasText: 'Female' }).click()
  await w.getByRole('button', { name: 'Add and check in' }).click()
  log(await seen(w.getByText('This patient already has an appointment that day', { exact: false }).or(w.getByRole('alert'))), 'duplicate walk-in same day is refused with a message')
  await page.keyboard.press('Escape')

  // ---- 5. Stats, Hindi, logout
  await search(page, '')
  const total = Number((await page.getByRole('button', { name: /Appointments/ }).first().textContent()).replace(/\D/g, ''))
  log(total >= 2, `stat tiles show counts (appointments today: ${total})`)
  await page.locator('header label', { hasText: 'हिंदी' }).click()
  log(await seen(page.getByRole('heading', { name: 'रिसेप्शन' })), 'dashboard switches to Hindi')
  await shot(page, 'r5-hindi')
  await page.locator('header label', { hasText: 'English' }).click()
  await page.getByRole('button', { name: 'Log out' }).click()
  await page.waitForURL('**/staff/login', { timeout: 8000 }).catch(() => {})
  log(page.url().endsWith('/staff/login'), 'logout returns to staff login')

  const unexpected = errors.filter((e) => !/status of 409/.test(e)) // expected: duplicate walk-in
  log(unexpected.length === 0, `no unexpected console errors${unexpected.length ? ' → ' + unexpected.join(' | ') : ''}`)
  await ctx.close()
}

// ---- 6. Doctor role cannot use reception --------------------------------------------------------
{
  const { ctx, page } = await staffPage()
  await staffLogin(page, 'doctor')
  log(await seen(page.getByRole('heading', { name: 'Today' })), 'doctor sees the doctor Today screen, not reception')
  const status = await page.evaluate(async () => (await fetch('/api/staff/appointments')).status)
  log(status === 403, `reception API refuses the doctor account (HTTP ${status})`)
  await ctx.close()
}

// ---- 7. Patient login is not staff login ----------------------------------------------------------
{
  const ctx = await browser.newContext()
  await ctx.addCookies([{ name: 'snh_session', value: today.cookie.split('=')[1], url: BASE }])
  const page = await ctx.newPage()
  await page.goto(BASE + '/staff', { waitUntil: 'networkidle' })
  log(page.url().endsWith('/staff/login'), 'a logged-in patient cannot open the staff area')
  await ctx.close()
}

// ---- 8. Phone layout ------------------------------------------------------------------------------
{
  const { ctx, page } = await staffPage({ width: 390, height: 844 })
  await staffLogin(page)
  await page.getByRole('heading', { name: 'Reception' }).waitFor()
  await page.waitForTimeout(800)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  log(overflow <= 0, `phone: no sideways scrolling (${overflow}px)`)
  log(await seen(page.locator('main ul li').getByRole('button', { name: /Details/ })), 'phone: appointments shown as cards with actions')
  await shot(page, 'r6-phone')
  await ctx.close()
}

await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
