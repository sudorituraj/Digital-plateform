/**
 * What people see when the server is unreachable or fails (scope §31: never a blank screen).
 * The API is cut off inside the browser; the preview server stays up. Run: npm run test:resilience
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
const NETWORK = 'No internet connection, or the server is not reachable'

async function page({ apiDown = false, apiStatus } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const p = await ctx.newPage()
  const crashes = []
  p.on('pageerror', (e) => crashes.push(e.message))
  if (apiDown) await p.route('**/api/**', (r) => r.abort('internetdisconnected'))
  if (apiStatus) await p.route('**/api/**', (r) => r.fulfill({ status: apiStatus, contentType: 'text/html', body: '<h1>Bad gateway</h1>' }))
  return { ctx, p, crashes }
}

// API unreachable
{
  const { ctx, p, crashes } = await page({ apiDown: true })
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  log(await seen(p.getByRole('heading', { name: 'Trusted care, close to home.' })), 'home page still works without the server')
  log(await seen(p.getByRole('link', { name: /Call|Book Now/ })), 'call / book buttons still available')
  await p.goto(BASE + '/book', { waitUntil: 'domcontentloaded' })
  await p.getByLabel('Mobile number').fill('9876543210')
  await p.getByRole('button', { name: 'Send code' }).click()
  log(await seen(p.getByText(NETWORK)), 'booking: clear "no connection" message instead of a blank screen')
  await p.goto(BASE + '/staff/login', { waitUntil: 'domcontentloaded' })
  await p.getByLabel('Username').fill('reception')
  await p.getByLabel('Password').fill('reception123')
  await p.getByRole('button', { name: 'Log in', exact: true }).click()
  log(await seen(p.getByText(NETWORK)), 'staff login: clear "no connection" message')
  log(crashes.length === 0, `no crashes${crashes.length ? ' → ' + crashes.join(' | ') : ''}`)
  await ctx.close()
}

// Server error while logged in (e.g. 502 from the hosting proxy)
{
  const { ctx, p, crashes } = await page()
  await p.goto(BASE + '/staff/login', { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: /reception123/ }).click()
  await p.getByRole('button', { name: 'Log in', exact: true }).click()
  await p.getByRole('heading', { name: 'Reception' }).waitFor()
  await p.route('**/api/staff/**', (r) => r.fulfill({ status: 502, contentType: 'text/html', body: 'Bad gateway' }))
  await p.goto(BASE + '/staff/analytics', { waitUntil: 'domcontentloaded' }).catch(() => {})
  await p.goto(BASE + '/staff/patients', { waitUntil: 'domcontentloaded' })
  log(await seen(p.getByText('Something went wrong. Please try again.')), 'staff pages show a friendly error on a server failure')
  await p.unroute('**/api/staff/**')
  await p.goto(BASE + '/staff', { waitUntil: 'networkidle' })
  log(await seen(p.getByRole('heading', { name: 'Reception' })), 'recovers once the server is back')
  log(crashes.length === 0, `no crashes${crashes.length ? ' → ' + crashes.join(' | ') : ''}`)
  await ctx.close()
}

await browser.close()
const failed = results.filter((ok) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
