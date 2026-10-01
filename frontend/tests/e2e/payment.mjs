/**
 * Demo payment end-to-end: fee shown when choosing a day, pay by UPI / card / net banking, declined
 * card, pay later + "Pay now", free follow-up within 14 days, reception "Mark paid (cash)".
 * Same setup as test:clinic (test backend on 8011 + preview on 4180). Run: npm run test:payment
 * Set SHOTS=<dir> to save phone screenshots of each step.
 */
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const SHOTS = process.env.SHOTS
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome' })
const results = []
const log = (ok, msg) => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`)
}
const seen = (locator, timeout = 8000) => locator.first().waitFor({ timeout }).then(() => true, () => false)
const randomPhone = () => `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`
const shot = (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) },
    body: body && JSON.stringify(body),
  })
  return { res, data: await res.json().catch(() => null) }
}

async function newPatient(name) {
  const phone = randomPhone()
  const { data: otp } = await api('/auth/otp/request', { method: 'POST', body: { phone } })
  const { res } = await api('/auth/otp/verify/register', { method: 'POST', body: { phone, code: otp.demo_code, name, age: 30, gender: 'female' } })
  return res.headers.get('set-cookie').split(';')[0]
}

async function patientPage(cookie) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.addCookies([{ name: 'snh_session', value: cookie.split('=')[1], url: BASE }])
  const page = await ctx.newPage()
  page.errors = []
  page.on('console', (m) => m.type() === 'error' && !/status of 402/.test(m.text()) && page.errors.push(m.text()))
  return page
}

async function bookTomorrow(page) {
  await page.goto(BASE + '/book', { waitUntil: 'networkidle' })
  await page.locator('label', { hasText: 'Tomorrow' }).click()
}

const run = Math.random().toString(36).slice(2, 6).toUpperCase()

// ---- 1. New patient: fee shown, pay by UPI ----------------------------------------------------------
const p1 = await patientPage(await newPatient(`Kiran ${run}`))
await bookTomorrow(p1)
log(await seen(p1.getByText('Consultation fee: ₹300')), 'choosing a day shows the ₹300 fee')
log(await seen(p1.getByText(/Follow-up visits within 14 days are free/)), 'fee note explains the 14-day free follow-up')
await p1.locator('label', { hasText: '10 AM – 12 PM' }).click()
await shot(p1, '1-fee-note')
await p1.getByRole('button', { name: 'Continue' }).click()
await p1.getByRole('button', { name: 'Continue' }).click()
log(await seen(p1.locator('dd', { hasText: '₹300' })), 'review shows the fee')
await p1.getByRole('button', { name: 'Send request & pay' }).click()
log(await seen(p1.getByRole('heading', { name: 'Payment' })), 'after sending, the payment step opens')
log(await seen(p1.getByText(/Your request SNH-\w+ is saved/)), 'payment step says the request is already saved')
log(await seen(p1.getByText('Demo payment')), 'payment is clearly marked as a demo')
await shot(p1, '2-pay-upi')
await p1.getByRole('button', { name: 'Pay ₹300' }).click()
log(await seen(p1.getByText('Please enter a valid UPI ID, like name@okaxis.')), 'empty UPI ID is caught before paying')
await p1.getByLabel('UPI ID').fill('fail@okaxis')
await p1.getByRole('button', { name: 'Pay ₹300' }).click()
log(await seen(p1.getByText('Processing payment…'), 2000), 'processing screen shows while paying')
log(await seen(p1.getByText('The payment did not go through.', { exact: false })), 'failed UPI payment shows a clear message')
await p1.getByLabel('UPI ID').fill('kiran@okaxis')
await p1.getByRole('button', { name: 'Pay ₹300' }).click()
await p1.waitForURL('**/appointments/SNH-*')
log(await seen(p1.getByText('Payment successful')), 'success screen after paying')
log(await seen(p1.getByText(/₹300 · UPI · DEMO-[0-9A-F]{8}/)), 'receipt shows amount, method and reference')
await shot(p1, '3-paid')
await p1.goto(BASE + '/my-appointments', { waitUntil: 'networkidle' })
log(await seen(p1.getByText('Paid', { exact: true })), 'My Appointments shows "Paid"')
await p1.goto(BASE + '/notifications', { waitUntil: 'networkidle' })
log(await seen(p1.getByText('Payment received')), 'patient gets a "Payment received" message')

// ---- 2. Card: brand detection, Luhn, declined, then success ---------------------------------------------
const c2 = await newPatient(`Rani ${run}`)
const { data: opts } = await api('/booking/options')
const { data: a2 } = await api('/appointments', { method: 'POST', cookie: c2, body: { date: opts.dates[2], time_slot: 'midday', name: `Rani ${run}`, age: 30, gender: 'female' } })
const p2 = await patientPage(c2)
await p2.goto(`${BASE}/appointments/${a2.request_id}`, { waitUntil: 'networkidle' })
log(await seen(p2.getByText('Payment pending')), 'unpaid appointment shows "Payment pending"')
await p2.getByRole('button', { name: 'Pay now · ₹300' }).click()
await p2.locator('label', { hasText: 'Card' }).click()
await p2.getByLabel('Card number').fill('4111111111111112')
await p2.getByLabel('Expiry').fill('1230')
await p2.getByLabel('CVV').fill('123')
await p2.getByLabel('Name on card').fill('Rani')
log((await p2.getByLabel('Card number').inputValue()) === '4111 1111 1111 1112', 'card number is spaced while typing')
log(await seen(p2.getByText('VISA', { exact: true })), 'card brand is detected')
log((await p2.getByLabel('Expiry').inputValue()) === '12/30', 'expiry gets its slash')
await p2.getByRole('button', { name: 'Pay ₹300' }).click()
log(await seen(p2.getByText('Please check the card number.')), 'mistyped card number is caught (checksum)')
await p2.getByLabel('Card number').fill('4000000000000002')
await p2.getByRole('button', { name: 'Pay ₹300' }).click()
log(await seen(p2.getByText('The card was declined.', { exact: false })), 'declined card shows a clear message')
const sent = []
p2.on('request', (r) => r.url().includes('/pay') && sent.push(r.postData()))
await p2.getByLabel('Card number').fill('4111111111111111')
await shot(p2, '4-pay-card')
await p2.getByRole('button', { name: 'Pay ₹300' }).click()
log(await seen(p2.getByText(/₹300 · Card · •••• 1111 · DEMO-/)), 'card payment succeeds on the appointment page')
log(sent.length === 1 && !sent[0].includes('4111111111111111') && sent[0].includes('"card_last4":"1111"'), 'only the last 4 digits are sent to the server')

// ---- 3. Pay later; reception collects cash -----------------------------------------------------------
const name3 = `Lata ${run}`
const p3 = await patientPage(await newPatient(name3))
await bookTomorrow(p3)
await p3.locator('label', { hasText: '2 – 4 PM' }).click()
await p3.getByRole('button', { name: 'Continue' }).click()
await p3.getByRole('button', { name: 'Continue' }).click()
await p3.getByRole('button', { name: 'Send request & pay' }).click()
await p3.locator('label', { hasText: 'Net banking' }).click()
log(await seen(p3.getByLabel('Your bank')), 'net banking asks for the bank')
await shot(p3, '5-pay-netbanking')
await p3.getByRole('button', { name: 'Pay later (online or at the clinic)' }).click()
await p3.waitForURL('**/appointments/SNH-*')
log(await seen(p3.getByText('Appointment Request Submitted')), 'paying later still submits the request')
log(await seen(p3.getByRole('button', { name: 'Pay now · ₹300' })), '"Pay now" is offered afterwards')

const staffCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const staff = await staffCtx.newPage()
await staff.goto(BASE + '/staff/login', { waitUntil: 'networkidle' })
await staff.getByRole('button', { name: /reception123/ }).click()
await staff.getByRole('button', { name: 'Log in', exact: true }).click()
await staff.getByRole('tab', { name: /New requests/ }).click()
await staff.getByLabel('Search appointments').fill(name3)
const row = staff.locator('tbody tr', { hasText: name3 })
log(await seen(row.getByText('Payment pending')), 'reception list shows "Payment pending"')
await row.getByRole('button', { name: 'Details' }).click()
await staff.getByRole('button', { name: 'Mark paid (cash)' }).click()
log(await seen(staff.getByRole('status').filter({ hasText: `Payment collected from ${name3}` })), 'reception marks the fee paid in cash')
log(await seen(staff.getByRole('dialog').getByText(/Paid · ₹300 · Cash at clinic · DEMO-/)), 'details show the cash payment')
await p3.reload({ waitUntil: 'networkidle' })
log(await seen(p3.getByText(/₹300 · Cash at clinic/)), 'patient sees the cash payment')

// ---- 4. Free follow-up within 14 days ---------------------------------------------------------------------
const name4 = `Usha ${run}`
const c4 = await newPatient(name4)
const { data: today4 } = await api('/appointments', { method: 'POST', cookie: c4, body: { date: opts.today, time_slot: 'afternoon', name: name4, age: 30, gender: 'female' } })
const staffCookie = `snh_staff=${(await staffCtx.cookies()).find((c) => c.name === 'snh_staff').value}`
for (const s of ['checked_in', 'waiting', 'completed']) {
  await api(`/staff/appointments/${today4.request_id}/status`, { method: 'POST', cookie: staffCookie, body: { status: s } })
}
const p4 = await patientPage(c4)
await bookTomorrow(p4)
log(await seen(p4.getByText('Free follow-up visit')), 'returning within 14 days: "Free follow-up visit"')
log(await seen(p4.getByText(/no payment needed until/)), 'says until when it is free')
await shot(p4, '6-free-follow-up')
await p4.locator('label', { hasText: '10 AM – 12 PM' }).click()
await p4.getByRole('button', { name: 'Continue' }).click()
await p4.getByRole('button', { name: 'Continue' }).click()
log(await seen(p4.locator('dd', { hasText: 'Free follow-up' })), 'review shows "Free follow-up"')
await p4.getByRole('button', { name: 'Send Appointment Request' }).click()
await p4.waitForURL('**/appointments/SNH-*')
log(await seen(p4.getByText(/No fee — free follow-up until/)), 'free follow-up is booked with no payment step')
log((await p4.getByRole('button', { name: /Pay now/ }).count()) === 0, 'no "Pay now" for a free visit')

// ---- 5. Hindi ---------------------------------------------------------------------------------------------
await p3.evaluate(() => localStorage.setItem('snh.language', 'hi'))
await p3.reload({ waitUntil: 'networkidle' })
log(await seen(p3.getByText('परामर्श शुल्क')), 'payment section in Hindi')

for (const [label, page] of [['UPI patient', p1], ['card patient', p2], ['pay-later patient', p3], ['follow-up patient', p4]]) {
  log(page.errors.length === 0, `${label}: no console errors${page.errors.length ? ' → ' + page.errors.join(' | ') : ''}`)
}

await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
