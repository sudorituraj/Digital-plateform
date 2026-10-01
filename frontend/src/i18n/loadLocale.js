import { DEFAULT_LANGUAGE, LANGUAGES, STORAGE_KEY } from './languages'

// English is bundled (it is the default and the fallback). Other languages are
// loaded on demand so first-time visitors don't download all four files.
const loaders = import.meta.glob(['../locales/*.json', '!../locales/en.json'], { import: 'default' })

export function readSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.some((l) => l.code === saved) ? saved : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

/** Load a language file (English is always bundled). */
export function loadLocale(code) {
  const load = loaders[`../locales/${code}.json`]
  return load ? load() : Promise.resolve(null)
}
