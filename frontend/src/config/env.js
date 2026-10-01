// Read public build-time flags once. Values come from .env.local / hosting settings.
const flag = (value, fallback) => (value === undefined ? fallback : value === 'true')

export const env = {
  demoMode: flag(import.meta.env.VITE_DEMO_MODE, true),
  showConfirmationMarkers: flag(import.meta.env.VITE_SHOW_CONFIRMATION_MARKERS, true),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
}
