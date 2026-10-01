/**
 * Services shown on the website. Text lives in locales under services.items.<key>.
 *
 * `verified: false` → the clinic has not yet confirmed this service. It is shown with a
 * "Needs client confirmation" marker. This draft list is based only on the clinic's public
 * association with women's health and pregnancy care — replace with the clinic's own list.
 */
export const SERVICES = [
  { slug: 'womens-health', key: 'womensHealth', icon: 'heart', verified: false },
  { slug: 'pregnancy-care', key: 'pregnancyCare', icon: 'baby', verified: false },
  { slug: 'delivery-care', key: 'delivery', icon: 'home', verified: false },
  { slug: 'follow-up', key: 'followUp', icon: 'fileText', verified: false },
]

export const findService = (slug) => SERVICES.find((s) => s.slug === slug)
