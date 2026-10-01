/**
 * Clinic facts used across the site.
 *
 * RULE: every value that the clinic has not explicitly confirmed is listed in
 * NEEDS_CONFIRMATION below. Placeholder values must look obviously fake so they
 * are never mistaken for real contact details.
 *
 * Display text (descriptions, headings) lives in the locale files, not here.
 *
 * Source: Justdial profile (https://www.justdial.com/Chapra/Saran-Nursing-Home-Research-Centre-...)
 *   - Phone: +91-9724830792
 *   - Address: Near Jyoti Cinema, Hotel Rubra, Chapra District Board, Sadhnapuri, Chapra, Bihar 841301
 *   - Hours: 24 Hours / Emergency Service 24 Hours
 *   - Consultation Fee: ₹300
 *   - Rating: 4.1/5 (167 ratings)
 */

export const clinic = {
  name: 'Saran Nursing Home & Research Centre',
  shortName: 'Saran Nursing Home',
  city: 'Chapra',
  state: 'Bihar',

  // Justdial: "Near Jyoti Cinema, Hotel Rubra, Chapra District Board, Sadhnapuri"
  addressLines: [
    'Near Jyoti Cinema, Hotel Rubra',
    'Chapra District Board, Sadhnapuri',
    'Chapra, Bihar 841301',
  ],

  // DEMO placeholder — obviously fake so testers never call the real clinic.
  // Justdial lists +91 97248 30792 (see PUBLIC_LISTING below); switch only after the clinic confirms it.
  phone: '+910000000000',
  phoneDisplay: '+91 00000 00000',
  whatsapp: '910000000000', // international format, digits only, for wa.me links

  mapQuery: 'Saran Nursing Home, Near Jyoti Cinema, Sadhnapuri, Chapra, Bihar',

  landmark: 'Near Jyoti Cinema / Hotel Rubra, Chapra District Board',
  // null = not confirmed → shown as "To be confirmed". (Justdial claims 24 h / 24 h emergency — NOT shown.)
  hours: null,

  doctor: {
    id: 'dr-neela-singh',
    name: 'Dr. Neela Singh', // client-provided: owner and the only doctor seeing patients
    qualifications: null,
    specialization: 'Gynaecology & Obstetrics', // from public listings — shown as unconfirmed
    experience: null,
    languages: null,
    consultationFee: 300, // from Justdial — shown as unconfirmed
  },

  // Features waiting for the clinic's approval stay switched off.
  features: {
    healthEducation: false, // /education/* pages: medical guidance must be approved by the doctor first
  },
}

/**
 * What public listings (Justdial) say — kept for reference only, NOT displayed.
 * Rating and 24-hour emergency claims must never appear unless the clinic confirms them (scope §3, §27).
 */
export const PUBLIC_LISTING = {
  source: 'Justdial',
  phone: '+91 97248 30792',
  hours: '24 hours; emergency service 24 hours',
  rating: '4.1 / 5 (167 ratings)',
}

/** Keys of facts that must be confirmed by the clinic before production. */
export const NEEDS_CONFIRMATION = [
  'addressLines',
  'phone',
  'whatsapp',
  'hours',
  'doctor.qualifications',
  'doctor.specialization',
  'doctor.experience',
  'doctor.consultationFee',
  'doctor.languages',
  'services',
  'photos',
]

export const telLink = () => `tel:${clinic.phone}`
export const whatsappLink = (text = '') =>
  `https://wa.me/${clinic.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`
export const mapsLink = () =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.mapQuery)}`
