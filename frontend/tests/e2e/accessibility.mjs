/**
 * Automated accessibility audit (axe-core, WCAG 2.1 A/AA rules) of every screen:
 * public site, patient pages, reception, patients, messages, analytics, doctor screens.
 * Same setup as test:clinic. Run: npm run test:a11y
 */
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const require = createRequire(import.meta.url)
const AXE = require.resolve('axe-core/axe.min.js')
const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const LANG = process.env.LANG_CODE ?? 'en'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome' })
const problems = []
let pages = 0

async function audit(page, label) {
  await page.waitForTimeout(700) // let reveal animations settle
  await page.evaluate(async () => { // reveal everything below the fold
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 30)) }
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
  await page.waitForTimeout(700)
  await page.addScriptTag({ path: AXE })
  const result = await page.evaluate(async () =>
    window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } }),
  )
  pages++
  for (const v of result.violations) {
    problems.push(`${label}: [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length}×) e.g. ${v.nodes[0].target.join(' ')}`)
  }
}

async function context(viewport) {
  const ctx = await browser.newContext({ viewport })
  await ctx.addInitScript((lang) => localStorage.setItem('snh.language', lang), LANG)
  return ctx
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  const tag = viewport.width < 500 ? 'phone' : 'desktop'
  const ctx = await context(viewport)
  const page = await ctx.newPage()
  for (const path of ['/', '/about', '/doctor', '/services', '/services/pregnancy-care', '/before-your-visit', '/contact', '/book', '/login', '/nope']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await audit(page, `${tag} ${path}`)
  }
  // mobile menu open
  if (tag === 'phone') {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.locator('button[aria-controls="mobile-menu"]').click()
    await audit(page, 'phone mobile-menu')
  }
  // patient pages (logged in via the API)
  const phone = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`
  const otp = await (await fetch(`${BASE}/api/auth/otp/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })).json()
  const reg = await fetch(`${BASE}/api/auth/otp/verify/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code: otp.demo_code, name: 'Audit Patient', age: 30, gender: 'female' }),
  })
  await ctx.addCookies([{ name: 'snh_session', value: reg.headers.get('set-cookie').split(';')[0].split('=')[1], url: BASE }])
  await page.goto(BASE + '/book', { waitUntil: 'networkidle' })
  await audit(page, `${tag} book: day & time`)
  await page.locator('label', { hasText: /Tomorrow|कल|काल्ह|Kal/ }).first().click()
  await page.locator('[name=booking-slot]').first().locator('..').click()
  await page.locator('form, main').getByRole('button').last().click()
  await audit(page, `${tag} book: details`)
  // payment: book via the API, then open the appointment's "Pay now" card form
  const cookie = (await ctx.cookies()).find((c) => c.name === 'snh_session')
  const opts = await (await fetch(`${BASE}/api/booking/options`)).json()
  const booked = await (await fetch(`${BASE}/api/appointments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `snh_session=${cookie.value}` },
    body: JSON.stringify({ date: opts.dates[3], time_slot: 'morning', name: 'Audit Patient', age: 30, gender: 'female' }),
  })).json()
  await page.goto(`${BASE}/appointments/${booked.request_id}`, { waitUntil: 'networkidle' })
  await page.locator('#payment-heading').locator('xpath=ancestor::section').getByRole('button').click()
  await page.locator('input[name=pay-method][value=card]').locator('..').click()
  await audit(page, `${tag} payment form`)
  for (const path of ['/my-appointments', '/notifications']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await audit(page, `${tag} ${path}`)
  }
  // staff pages
  for (const role of ['reception', 'doctor']) {
    await page.goto(BASE + '/staff/login', { waitUntil: 'networkidle' })
    await audit(page, `${tag} staff login`)
    await page.getByRole('button', { name: new RegExp(`${role}123`) }).click()
    await page.locator('form button[type=submit]').click()
    await page.waitForURL((u) => !u.pathname.endsWith('/login'))
    const paths = role === 'reception' ? ['/staff', '/staff/queue', '/staff/patients', '/staff/messages', '/staff/analytics'] : ['/staff', '/staff/analytics']
    for (const path of paths) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' })
      await audit(page, `${tag} ${role} ${path}`)
    }
    if (role === 'reception') {
      await page.goto(BASE + '/staff', { waitUntil: 'networkidle' })
      await page.locator('button', { hasText: /walk-in|वॉक-इन|Walk-in/i }).first().click()
      await audit(page, `${tag} walk-in dialog`)
      await page.keyboard.press('Escape')
      await page.goto(BASE + '/staff/patients', { waitUntil: 'networkidle' })
      await page.locator('main li a').first().click()
      await page.waitForURL('**/staff/patients/P*')
      await audit(page, `${tag} patient profile`)
    } else {
      const visit = page.locator('main a[href*="/staff/visit/"]').first()
      if (await visit.count()) {
        await visit.click()
        await page.waitForURL('**/staff/visit/**')
        await audit(page, `${tag} doctor visit`)
      }
    }
    await page.context().clearCookies({ name: 'snh_staff' })
  }
  await ctx.close()
}

await browser.close()
console.log(`Audited ${pages} screens (${LANG}).`)
if (problems.length) {
  console.log(`\n${problems.length} accessibility problem(s):\n` + problems.join('\n'))
  process.exit(1)
}
console.log('No accessibility violations found.')
