// Writes dist/robots.txt and dist/sitemap.xml after `vite build`.
// Set SITE_URL to the clinic's real domain when deploying, e.g. SITE_URL=https://www.sarannursinghome.in
import { writeFileSync } from 'node:fs'

const site = (process.env.SITE_URL ?? 'https://example.com').replace(/\/$/, '')
if (!process.env.SITE_URL) console.warn('seo-files: SITE_URL not set — using https://example.com (set it for production).')

const pages = ['/', '/about', '/doctor', '/services', '/services/womens-health', '/services/pregnancy-care',
  '/services/delivery-care', '/services/follow-up', '/before-your-visit', '/contact', '/book']

writeFileSync('dist/robots.txt', `User-agent: *
Allow: /
# Staff, patient-account and demo pages are not for search engines.
Disallow: /staff
Disallow: /my-appointments
Disallow: /appointments/
Disallow: /notifications
Disallow: /login
Disallow: /design-system

Sitemap: ${site}/sitemap.xml
`)

writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n')}
</urlset>
`)
console.log(`seo-files: robots.txt + sitemap.xml (${pages.length} pages) for ${site}`)
