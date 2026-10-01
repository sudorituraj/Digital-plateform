// Card helpers for the DEMO checkout. The full number stays in the browser: only the brand and the
// last 4 digits are sent to the server (a real gateway's hosted checkout would take the number instead).

export const digits = (s) => s.replace(/\D/g, '')

/** Luhn checksum — catches most typing mistakes before "paying". */
export function luhnValid(number) {
  const d = digits(number)
  if (d.length < 12 || d.length > 19) return false
  let sum = 0
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

export function cardBrand(number) {
  const d = digits(number)
  if (/^4/.test(d)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard'
  if (/^(60|65|81|82|508)/.test(d)) return 'rupay'
  if (/^3[47]/.test(d)) return 'amex'
  return d.length >= 4 ? 'other' : null
}

/** "4111111111111111" → "4111 1111 1111 1111" (Amex: 4-6-5). */
export function formatCardNumber(value) {
  const d = digits(value).slice(0, 19)
  const groups = cardBrand(d) === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3]
  const out = []
  let i = 0
  for (const g of groups) {
    if (i >= d.length) break
    out.push(d.slice(i, i + g))
    i += g
  }
  return out.join(' ')
}

/** "1228" → "12/28" while typing. */
export function formatExpiry(value) {
  const d = digits(value).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function expiryValid(value, now = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

export const formatRupees = (amount, language) =>
  new Intl.NumberFormat(language === 'en' || language === 'hinglish' ? 'en-IN' : 'hi-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
