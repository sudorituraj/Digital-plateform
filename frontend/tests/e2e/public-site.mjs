/**
 * Browser checks for the public website (Stages 1.1–1.2).
 *
 *   npm run build && npm run preview      # in one terminal
 *   npm run test:e2e                      # in another
 *
 * Env: BASE_URL (default http://localhost:4180), CHROME_PATH (default /usr/bin/google-chrome),
 *      SCREENSHOTS=<dir> to save full-page screenshots for visual review.
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const SHOTS = process.env.SCREENSHOTS
if (SHOTS) mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome' })
const results = []
const log = (ok, msg) => { results.push([ok, msg]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`) }

const routes = ['/', '/about', '/doctor', '/services', '/services/womens-health', '/services/pregnancy-care', '/services/delivery-care', '/services/follow-up', '/services/unknown', '/before-your-visit', '/contact', '/book', '/design-system', '/nope']
const viewports = { phone: [360, 740], tablet: [768, 1024], laptop: [1280, 800], desktop: [1440, 900] }

for (const [name, [w, h]] of Object.entries(viewports)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } })
  const page = await ctx.newPage()
  const errors = []
  const overflows = []
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(`${m.type()}: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  for (const r of routes) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (overflow > 0) overflows.push(`${r} (${overflow}px)`)
    const h1 = await page.locator('h1').count()
    if (h1 !== 1) log(false, `${name} ${r}: expected 1 h1, found ${h1}`)
  }
  for (const r of ['/', '/about', '/doctor', '/services', '/services/pregnancy-care', '/before-your-visit', '/contact']) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' })
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)) } window.scrollTo({ top: 0, behavior: 'instant' }) })
    await page.waitForTimeout(700)
    if (SHOTS && (name === 'phone' || name === 'desktop')) await page.screenshot({ path: `${SHOTS}/${(r.slice(1) || 'home').replace(/\//g, '_')}-${name}.png`, fullPage: true })
  }
  await page.goto(BASE + '/design-system', { waitUntil: 'networkidle' })
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } })
  await page.waitForTimeout(700)
  if (SHOTS && (name === 'phone' || name === 'desktop')) await page.screenshot({ path: `${SHOTS}/ds-${name}.png`, fullPage: true })
  log(overflows.length === 0, `${name}: no horizontal scrolling on any route${overflows.length ? ' → ' + overflows.join(', ') : ''}`)
  log(errors.length === 0, `${name}: no console errors/warnings across ${routes.length} routes${errors.length ? ' → ' + errors.join(' | ') : ''}`)

  // Small touch targets (outside of running text)
  const small = await page.evaluate(() => [...document.querySelectorAll('a,button,label:has(input)')].filter(el => {
    const r = el.getBoundingClientRect(); return r.width && r.height && r.height < 36 && !el.closest('p')
  }).map(el => `${el.tagName}:${el.textContent.trim().slice(0, 20)}(${Math.round(el.getBoundingClientRect().height)})`))
  if (small.length) console.log(`INFO  ${name}: targets <36px: ${[...new Set(small)].join(', ')}`)
  await ctx.close()
}

// Language switching + persistence
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const expected = { 'हिंदी': ['hi', 'भरोसेमंद इलाज, आपके पास।'], 'भोजपुरी': ['bho', 'भरोसा वाला इलाज, रउआ लगे।'], 'Hinglish': ['hi-Latn', 'Bharosemand ilaaj, aapke paas.'], 'English': ['en', 'Trusted care, close to home.'] }
  for (const [label, [lang, title]] of Object.entries(expected)) {
    await page.locator('label', { hasText: label }).first().click()
    await page.waitForFunction((l) => document.documentElement.lang === l, lang)
    const h1 = (await page.locator('h1').textContent()).trim()
    log(h1 === title, `language ${label}: html lang=${lang}, h1="${h1}"`)
  }
  await page.locator('label', { hasText: 'हिंदी' }).first().click()
  await page.reload({ waitUntil: 'networkidle' })
  log(await page.evaluate(() => document.documentElement.lang) === 'hi', 'language choice persists after reload')
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/home-phone-hindi.png`, fullPage: true })
  const title = await page.title()
  log(title.includes('सारण'), `page title localised: ${title}`)

  // Mobile menu: open, focus inside, Esc closes, focus returns
  const btn = page.getByRole('button', { name: 'मेन्यू खोलें' })
  await btn.click()
  const dialog = page.getByRole('dialog')
  log(await dialog.isVisible(), 'mobile menu opens as dialog')
  await page.waitForTimeout(350)
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/menu-phone.png` })
  log(await page.evaluate(() => !!document.activeElement.closest('[role=dialog]')), 'focus moves into menu')
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab')
  log(await page.evaluate(() => !!document.activeElement.closest('[role=dialog]')), 'focus trapped inside menu')
  await page.keyboard.press('Escape')
  log(!(await dialog.count()), 'Escape closes menu')
  log(await page.evaluate(() => document.activeElement.getAttribute('aria-controls') === 'mobile-menu'), 'focus returns to menu button')
  await btn.click()
  await page.getByRole('dialog').getByRole('link', { name: 'डॉक्टर' }).click()
  await page.waitForURL('**/doctor')
  const closed = await page.waitForFunction(() => !document.querySelector('[role=dialog]'), null, { timeout: 2000 }).then(() => true, () => false)
  log(closed, 'menu closes after navigating')
  await ctx.close()
}

// Crawl: every internal link on public pages leads to a real page
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const seen = new Set(), queue = ['/'], broken = []
  while (queue.length) {
    const path = queue.shift(); if (seen.has(path)) continue; seen.add(path)
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const nf = await page.getByText('Page not found').count()
    if (nf && !['/nope', '/design-system'].includes(path)) broken.push(path)
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href').split('#')[0]))
    for (const l of links) if (!seen.has(l)) queue.push(l)
    const ext = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => !h.startsWith(location.origin)))
    for (const h of ext) if (!/^(tel:|https:\/\/wa\.me\/|https:\/\/www\.google\.com\/maps)/.test(h)) broken.push('unexpected external: ' + h)
  }
  log(broken.length === 0, `crawled ${seen.size} internal pages, no broken links${broken.length ? ' → ' + broken.join(', ') : ''}`)
  // Map loads only on request
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle' })
  log(await page.locator('iframe').count() === 0, 'map iframe not loaded until asked')
  await page.getByRole('button', { name: 'Show map' }).click()
  log(await page.locator('iframe[src*="google.com/maps"]').count() === 1, 'Show map loads Google map iframe')
  // Unknown service → not found; service title in tab
  await page.goto(BASE + '/services/unknown', { waitUntil: 'networkidle' })
  log(await page.getByText('Page not found').count() > 0, 'unknown service slug shows Page not found')
  await page.goto(BASE + '/services/pregnancy-care', { waitUntil: 'networkidle' })
  log((await page.title()).startsWith('Pregnancy care'), `service page title: ${await page.title()}`)
  const desc = await page.locator('meta[name=description]').getAttribute('content')
  log(desc.startsWith('Services at'), 'service page meta description set')
  // Needs-confirmation markers present on doctor page for unverified credentials
  await page.goto(BASE + '/doctor', { waitUntil: 'networkidle' })
  const markers = await page.getByText('Confirmation pending').count()
  log(markers >= 6, `doctor page marks unverified facts (${markers} markers)`)
  // Language check on content pages: no English leaks in Hindi on key pages
  await page.evaluate(() => localStorage.setItem('snh.language', 'hi'))
  for (const r of ['/', '/about', '/doctor', '/services', '/services/delivery-care', '/before-your-visit', '/contact']) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' })
    const leaks = await page.evaluate(() => {
      const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT)
      const out = []; let n
      while ((n = w.nextNode())) { const s = n.textContent.trim(); if (/[A-Za-z]{4,}/.test(s) && !/Google|OTP|WhatsApp|Sadhnapuri|Saran, Bihar|ID/.test(s)) out.push(s) }
      return out
    })
    log(leaks.length === 0, `Hindi ${r}: no untranslated English${leaks.length ? ' → ' + leaks.slice(0, 5).join(' | ') : ''}`)
  }
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/contact-desktop-hindi.png`, fullPage: true })
  await ctx.close()
}

// Header stays on one line in every language at every tablet/desktop width
{
  const problems = []
  for (const w of [640, 768, 1024, 1280, 1366, 1536, 1920]) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } })
    for (const l of ['en', 'hi', 'bho', 'hinglish']) {
      await page.goto(BASE + '/')
      await page.evaluate((l) => localStorage.setItem('snh.language', l), l)
      await page.reload({ waitUntil: 'networkidle' })
      const tall = await page.evaluate(() =>
        [...document.querySelectorAll('header a, header button')]
          .filter((e) => e.offsetParent && e.getBoundingClientRect().height > 52)
          .map((e) => e.textContent.trim()),
      )
      if (tall.length) problems.push(`${w}px ${l}: ${tall.join(', ')}`)
    }
    await page.close()
  }
  log(problems.length === 0, `header fits on one line (7 widths × 4 languages)${problems.length ? ' → ' + problems.join(' | ') : ''}`)
}

// Keyboard: first Tab lands on skip link
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')
  const txt = await page.evaluate(() => document.activeElement.textContent)
  log(txt.includes('Skip'), `first Tab focuses skip link ("${txt}")`)
  await page.keyboard.press('Enter')
  log(await page.evaluate(() => location.hash === '#main'), 'skip link jumps to main')
  // reduced motion: reveal elements visible immediately
  await ctx.close()
  const rm = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
  const p2 = await rm.newPage()
  await p2.goto(BASE + '/design-system', { waitUntil: 'networkidle' })
  const op = await p2.evaluate(() => getComputedStyle(document.querySelectorAll('.reveal')[5]).opacity)
  log(op === '1', `prefers-reduced-motion: off-screen reveal content visible (opacity ${op})`)
  await rm.close()
}

// Form validation on design system page
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(BASE + '/design-system', { waitUntil: 'networkidle' })
  await page.getByLabel('Mobile number').fill('98ab76')
  log((await page.getByLabel('Mobile number').inputValue()) === '9876', 'phone field strips non-digits')
  await page.locator('form').getByRole('button', { name: 'Continue' }).click()
  log(await page.getByText('Please enter a valid 10-digit mobile number.').isVisible(), 'phone validation error shown')
  log((await page.getByLabel('Mobile number').getAttribute('aria-invalid')) === 'true', 'invalid field has aria-invalid')
  await ctx.close()
}

await browser.close()
const failed = results.filter(([ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
