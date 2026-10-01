/**
 * Stage 3.1 end-to-end: patient messages (bell + inbox), simulated WhatsApp outbox, analytics.
 * Same setup as test:clinic (test backend on 8011 + preview on 4180). Run: npm run test:notify
 */
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome' })
const results = []
const log = (ok, msg) => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`)
}
const seen = (locator, timeout = 8000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const run = Math.random().toString(36).slice(2, 6).toUpperCase()
const randomPhone = () => `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) },
    body: body && JSON.stringify(body),
  })
  return { res, data: await res.json().catch(() => null) }
}

// Patient registers and books for the day after tomorrow.
const name = `Nisha ${run}`
const phone = randomPhone()
const { data: otp } = await api('/auth/otp/request', { method: 'POST', body: { phone } })
const { res: reg } = await api('/auth/otp/verify/register', { method: 'POST', body: { phone, code: otp.demo_code, name, age: 27, gender: 'female' } })
const patientCookie = reg.headers.get('set-cookie').split(';')[0]
const { data: options } = await api('/booking/options')
const { data: booked } = await api('/appointments', {
  method: 'POST',
  cookie: patientCookie,
  body: { date: options.dates[2], time_slot: 'evening', name, age: 27, gender: 'female' },
})

// ---- Patient: bell + inbox ------------------------------------------------------------------------
const patientCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
await patientCtx.addCookies([{ name: 'snh_session', value: patientCookie.split('=')[1], url: BASE }])
const patient = await patientCtx.newPage()
const patientErrors = []
patient.on('console', (m) => m.type() === 'error' && patientErrors.push(m.text()))
await patient.goto(BASE + '/', { waitUntil: 'networkidle' })
log(await seen(patient.getByRole('link', { name: 'Messages, 1 new' })), 'patient bell shows 1 new message')
await patient.getByRole('link', { name: 'Messages, 1 new' }).first().click()
await patient.waitForURL('**/notifications')
log(await seen(patient.getByText('We received your appointment request')), 'inbox shows "request received"')
log(await seen(patient.getByText(booked.request_id)), 'message links to the request ID')
log(await seen(patient.getByText('In this demo nothing is actually sent')), 'inbox explains messages are simulated')
await patient.goto(BASE + '/', { waitUntil: 'networkidle' })
log(await seen(patient.getByRole('link', { name: 'Messages', exact: true })), 'after reading, the bell shows no count')

// ---- Reception confirms → patient gets a message; outbox shows it -------------------------------------
const staffCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const staff = await staffCtx.newPage()
const staffErrors = []
staff.on('console', (m) => m.type() === 'error' && staffErrors.push(m.text()))
await staff.goto(BASE + '/staff/login', { waitUntil: 'networkidle' })
await staff.getByRole('button', { name: /reception123/ }).click()
await staff.getByRole('button', { name: 'Log in', exact: true }).click()
await staff.getByRole('tab', { name: /New requests/ }).click()
await staff.getByLabel('Search appointments').fill(name)
await staff.locator('tbody tr', { hasText: name }).getByRole('button', { name: 'Confirm' }).click()
await seen(staff.getByRole('status').filter({ hasText: `${name} confirmed` }))

await patient.goto(BASE + '/notifications', { waitUntil: 'networkidle' })
log(await seen(patient.getByText('Your appointment is confirmed')), 'patient receives "appointment confirmed"')

await staff.getByRole('link', { name: 'Messages', exact: true }).click()
const card = staff.locator('main li', { hasText: name })
log(await seen(card.getByText('Your appointment is confirmed')), 'reception outbox shows the confirmation for the patient')
log(await seen(card.getByText('Simulated')), 'outbox marks messages as Simulated')
await staff.getByRole('button', { name: 'Request received', exact: true }).click()
await staff.waitForTimeout(800)
log(
  (await card.getByText('Your appointment is confirmed').count()) === 0 && (await seen(card.getByText('We received your appointment request'))),
  'outbox filter by type works',
)

// ---- Analytics ----------------------------------------------------------------------------------------
await staff.getByRole('link', { name: 'Analytics', exact: true }).click()
await staff.getByRole('heading', { name: 'Analytics' }).waitFor()
const cookies = await staffCtx.cookies()
const staffCookie = `snh_staff=${cookies.find((c) => c.name === 'snh_staff').value}`
const { data: a30 } = await api('/staff/analytics?days=30', { cookie: staffCookie })
await staff.waitForTimeout(1200) // count-up animation
const tileValue = async (label) =>
  Number((await staff.locator('dl > div', { has: staff.locator('dt', { hasText: new RegExp(`^${label}$`) }) }).locator('dd').first().textContent()).replace(/\D/g, ''))
log((await tileValue('Appointments')) === a30.totals.appointments, `appointments tile matches the API (${a30.totals.appointments})`)
log((await tileValue('New patients')) === a30.totals.new_patients, `new-patients tile matches the API (${a30.totals.new_patients})`)
await staff.getByRole('button', { name: 'Last 7 days' }).click()
log(await seen(staff.locator('ol[aria-label] li').nth(6)) && (await staff.locator('ol[aria-label] li').count()) === 7, '7-day view shows 7 bars')
await staff.locator('ol[aria-label] button').last().focus()
log(await seen(staff.getByRole('tooltip')), 'keyboard focus on a bar shows its tooltip')
await staff.getByRole('button', { name: 'Show as table' }).click()
log((await staff.locator('figure table tbody tr').count()) === 7, 'table view lists every day')
await staff.locator('header label', { hasText: 'हिंदी' }).click()
log(await seen(staff.getByRole('heading', { name: 'आँकड़े' })), 'analytics in Hindi')
await staff.locator('header label', { hasText: 'English' }).click()

// ---- Roles ----------------------------------------------------------------------------------------------
const docCtx = await browser.newContext()
const doc = await docCtx.newPage()
await doc.goto(BASE + '/staff/login', { waitUntil: 'networkidle' })
await doc.getByRole('button', { name: /doctor123/ }).click()
await doc.getByRole('button', { name: 'Log in', exact: true }).click()
log(await seen(doc.getByRole('link', { name: 'Analytics', exact: true })), 'doctor can open Analytics')
await doc.goto(BASE + '/staff/messages', { waitUntil: 'networkidle' })
log(!doc.url().endsWith('/staff/messages'), 'doctor is not shown the message outbox')

log(patientErrors.length === 0, `patient: no console errors${patientErrors.length ? ' → ' + patientErrors.join(' | ') : ''}`)
log(staffErrors.length === 0, `staff: no console errors${staffErrors.length ? ' → ' + staffErrors.join(' | ') : ''}`)

await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
