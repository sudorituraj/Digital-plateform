// Verifies every locale file has exactly the same keys as en.json (the source of truth).
// Run: npm run check:locales
import { readdirSync, readFileSync } from 'node:fs'

const dir = new URL('../src/locales/', import.meta.url)
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  )
const load = (file) => new Map(flatten(JSON.parse(readFileSync(new URL(file, dir), 'utf8'))))

const base = load('en.json')
let problems = 0
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'en.json')) {
  const other = load(file)
  const missing = [...base.keys()].filter((k) => !other.has(k))
  const extra = [...other.keys()].filter((k) => !base.has(k))
  const empty = [...other].filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k)
  // Placeholders like {year} must survive translation.
  const vars = [...base].filter(([k, v]) => {
    const want = (v.match(/\{\w+\}/g) ?? []).sort().join()
    return other.has(k) && want !== ((other.get(k).match(/\{\w+\}/g) ?? []).sort().join())
  }).map(([k]) => k)
  for (const [label, list] of [['missing', missing], ['extra', extra], ['empty', empty], ['placeholder mismatch', vars]]) {
    if (list.length) {
      problems += list.length
      console.error(`${file}: ${label}: ${list.join(', ')}`)
    }
  }
}
console.log(problems ? `\n${problems} locale problem(s) found.` : `All locales match en.json (${base.size} keys).`)
process.exit(problems ? 1 : 0)
