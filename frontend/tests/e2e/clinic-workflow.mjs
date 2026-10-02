/**
 * Stages 2.2 + 2.3 end-to-end — the complete clinic workflow:
 *   Patient books → Reception checks in → Doctor sees queue → note + follow-up → Completed,
 *   plus patient management (search, profile, edit, notes, add patient, book from profile),
 *   who can read consultation notes (all staff; never patients) and role separation.
 *
 * Same setup as test:journey / test:reception (test backend on 8011 + preview on 4180):
 *   (backend)  MONGODB_DB=saran_e2e OTP_PER_IP_PER_HOUR=1000 OTP_VERIFY_PER_IP_PER_HOUR=1000 FIXED_CLOCK_HOUR=9 STAFF_LOGIN_PER_IP_PER_HOUR=1000 \
 *              .venv/bin/uvicorn app.main:app --port 8011
 *   (frontend) npm run build && API_TARGET=http://localhost:8011 npm run preview
 *   (frontend) npm run test:clinic
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
const toast = (page, text) => seen(page.getByRole('status').filter({ hasText: text }), 6000)
const run = Math.random().toString(36).slice(2, 6).toUpperCase()
const randomPhone = () => `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`
const NOTE = `Consultation note ${run}: BP normal, advised rest.`

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) },
    body: body && JSON.stringify(body),
  })
  return { res, data: await res.json().catch(() => null) }
}

async function patientBooks(name, dayOffset, reason) {
  const phone = randomPhone()
  const { data: otp } = await api('/auth/otp/request', { method: 'POST', body: { phone } })
  const { res } = await api('/auth/otp/verify/register', {
    method: 'POST',
    body: { phone, code: otp.demo_code, name, age: 34, gender: 'female' },
  })
  const cookie = res.headers.get('set-cookie').split(';')[0]
  const { data: options } = await api('/booking/options')
  const { data } = await api('/appointments', {
    method: 'POST',
    cookie,
    body: { date: options.dates[dayOffset], time_slot: 'morning', name, age: 34, gender: 'female', reason },
  })
  return { rid: data.request_id, cookie, phone }
}

async function staffContext(role, viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(BASE + '/staff/login', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: new RegExp(`${role}123`) }).click()
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.endsWith('/login'))
  return { ctx, page, errors }
}

const name = `Sarita ${run}`
const booking = await patientBooks(name, 0, 'Pregnancy check-up')

// ---- Reception: check in, then patient management ---------------------------------------------------
const reception = await staffContext('reception')
{
  const { page } = reception
  await page.getByLabel('Search appointments').fill(name)
  const row = page.locator('tbody tr', { hasText: name })
  await row.getByRole('button', { name: 'Check in' }).click()
  log(await toast(page, `${name} checked in — token`), 'reception checks the patient in (token)')

  // Patient name in the list opens the profile
  await row.getByRole('link', { name, exact: true }).click()
  await page.waitForURL('**/staff/patients/P*')
  log(await seen(page.getByRole('heading', { name })), 'patient name in the day list opens the patient profile')
  log(await seen(page.getByText(booking.rid)), 'profile lists the online booking (booking ↔ patient linked)')

  // Edit details
  await page.getByRole('button', { name: 'Edit details' }).click()
  await page.getByRole('dialog').getByLabel(/Address/).fill('Sadhnapuri, Chapra')
  await page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click()
  log(await toast(page, 'Details saved'), 'edit patient details → saved')
  log(await seen(page.getByText('Sadhnapuri, Chapra')), 'new address shown on the profile')

  // Front-desk note
  await page.getByLabel('New note').fill('Prefers Bhojpuri')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  log(await seen(page.getByText('Prefers Bhojpuri')), 'front-desk note added')

  // Book another appointment from the profile
  await page.getByRole('button', { name: 'Book appointment' }).click()
  const dlg = page.getByRole('dialog')
  await dlg.locator('[name=booking-date]').nth(2).locator('..').click()
  await dlg.getByRole('button', { name: 'Book appointment' }).click()
  log(await toast(page, `${name} booked for`), 'book a later appointment from the profile')
  await shot(page, 'c1-profile')

  // Patients list: search + add patient + duplicate
  await page.getByRole('link', { name: 'Patients', exact: true }).first().click()
  await page.getByLabel('Search patients').fill(name)
  log(await seen(page.locator('main li', { hasText: name })), 'patients list search finds the patient')
  await page.getByRole('button', { name: 'Add patient' }).click()
  const add = page.getByRole('dialog')
  const newPhone = randomPhone()
  await add.getByLabel('Mobile number').fill(newPhone)
  await add.getByLabel('Full name').fill(`Usha ${run}`)
  await add.getByLabel('Age', { exact: true }).fill('60')
  await add.locator('label', { hasText: 'Female' }).click()
  await add.getByRole('button', { name: 'Add patient' }).click()
  await page.waitForURL('**/staff/patients/P*')
  log(await seen(page.getByRole('heading', { name: `Usha ${run}` })), 'add patient → opens the new profile')
  await page.getByRole('link', { name: 'Patients', exact: true }).first().click()
  await page.getByRole('button', { name: 'Add patient' }).click()
  await add.getByLabel('Mobile number').fill(newPhone)
  await add.getByLabel('Full name').fill('Someone Else')
  await add.getByLabel('Age', { exact: true }).fill('30')
  await add.locator('label', { hasText: 'Female' }).click()
  await add.getByRole('button', { name: 'Add patient' }).click()
  log(await seen(add.getByText('A patient with this mobile number already exists')), 'same mobile number twice is refused')
  await page.keyboard.press('Escape')
  await shot(page, 'c2-patients')

  // Reception can view the doctor's queue and visit screen, read-only
  await page.getByRole('link', { name: "Doctor's queue" }).click()
  await page.waitForURL('**/staff/queue')
  log(await seen(page.getByText(name)), "reception sees the patient in the doctor's queue")
  await page.goto(`${BASE}/staff/visit/${booking.rid}`, { waitUntil: 'networkidle' })
  log(await seen(page.getByText('View only. Only the doctor can write')), 'reception opens the visit screen in view-only mode')
  log((await page.getByLabel(/Consultation note/).count()) === 0, 'reception has no note editor')
}

// ---- Doctor: queue → visit → draft → complete ----------------------------------------------------
const doctor = await staffContext('doctor')
{
  const { page } = doctor
  log(await seen(page.getByRole('heading', { name: 'Today' })), 'doctor lands on Today')
  const item = page.locator('main ol li', { hasText: name })
  log(await seen(item), 'checked-in patient appears in the doctor queue')
  await shot(page, 'c3-doctor-today')
  await item.getByRole('link').click()
  await page.waitForURL(`**/staff/visit/${booking.rid}`)
  log(await seen(page.getByText('Pregnancy check-up')), "visit screen shows today's reason")
  log(await seen(page.getByText('This is the first visit.')), 'first visit: no previous notes')

  await page.getByLabel(/Consultation note/).fill(NOTE)
  await page.getByRole('button', { name: '2 weeks' }).click()
  log(await seen(page.getByText('Follow-up on')), 'follow-up quick choice shows the date')
  await page.getByRole('button', { name: 'Save draft' }).click()
  log(await toast(page, 'Draft saved'), 'save draft')
  await page.reload({ waitUntil: 'networkidle' })
  log((await page.getByLabel(/Consultation note/).inputValue()) === NOTE, 'draft note is still there after reload')
  await shot(page, 'c4-doctor-visit')

  await page.getByRole('button', { name: 'Mark visit completed' }).click()
  await page.waitForURL('**/staff')
  log(await toast(page, `${name}'s visit completed`), 'complete visit → back to Today with confirmation')
  log(await seen(page.locator('main ul li', { hasText: name })), 'patient moves to "Seen today"')

  // Doctor can read the full profile including notes, but not the reception patient list
  await page.goto(`${BASE}/staff/visit/${booking.rid}`, { waitUntil: 'networkidle' })
  log(await seen(page.getByText(NOTE)), 'completed visit shows the note (read-only)')
  await page.goto(`${BASE}/staff/patients`, { waitUntil: 'networkidle' })
  log(!page.url().endsWith('/staff/patients'), 'doctor is not given the reception patient list')
}

// ---- Privacy + everyone sees the result ------------------------------------------------------------
{
  const { page } = reception
  await page.goto(`${BASE}/staff`, { waitUntil: 'networkidle' })
  await page.getByLabel('Search appointments').fill(name)
  log(await seen(page.locator('tbody tr', { hasText: name }).getByText('Completed', { exact: true })), 'reception sees Completed')
  await page.locator('tbody tr', { hasText: name }).getByRole('link', { name, exact: true }).click()
  await page.waitForURL('**/staff/patients/P*')
  log(await seen(page.getByText('Visits: 1')), 'profile counts the visit')
  log(await seen(page.getByText('Follow-up:')), 'reception sees the follow-up date')
  log(await seen(page.getByText(NOTE)), 'reception can read the consultation note')
  await shot(page, 'c5-profile-after')

  const me = (await api('/me', { cookie: booking.cookie })).data
  log(Boolean(me.follow_up_date), `patient's account shows the follow-up date (${me.follow_up_date})`)
  const mine = JSON.stringify((await api('/appointments/mine', { cookie: booking.cookie })).data)
  log(mine.includes('"completed"') && !mine.includes(run + ': BP'), 'patient sees Completed but never the note')
}

// ---- Hindi + phone ------------------------------------------------------------------------------------
{
  const { page, errors } = doctor
  await page.goto(`${BASE}/staff`, { waitUntil: 'networkidle' })
  await page.locator('header label', { hasText: 'हिंदी' }).click()
  log(await seen(page.getByRole('heading', { name: 'आज' })), 'doctor screen in Hindi')
  await page.locator('header label', { hasText: 'English' }).click()
  log(errors.length === 0, `doctor: no console errors${errors.length ? ' → ' + errors.join(' | ') : ''}`)
  const unexpected = reception.errors.filter((e) => !/status of 409/.test(e)) // expected: duplicate patient
  log(unexpected.length === 0, `reception: no unexpected console errors${unexpected.length ? ' → ' + unexpected.join(' | ') : ''}`)

  const phone = await staffContext('doctor', { width: 390, height: 844 })
  await phone.page.waitForTimeout(800)
  const overflow = await phone.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  log(overflow <= 0, `phone: doctor screen has no sideways scrolling (${overflow}px)`)
  await shot(phone.page, 'c6-doctor-phone')
  await phone.ctx.close()
}

await reception.ctx.close()
await doctor.ctx.close()
await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
