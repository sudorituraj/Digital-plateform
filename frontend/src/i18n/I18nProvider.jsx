import { useCallback, useEffect, useMemo, useState } from 'react'
import en from '../locales/en.json'
import { I18nContext } from './context'
import { DEFAULT_LANGUAGE, LANGUAGES, STORAGE_KEY } from './languages'
import { loadLocale, readSavedLanguage } from './loadLocale'

function lookup(messages, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), messages)
}

function interpolate(text, vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

/**
 * `initial` = { language, messages } preloaded in main.jsx, so a Hindi/Bhojpuri visitor
 * never sees a flash of English on page load.
 */
export function I18nProvider({ initial, children }) {
  const [language, setLanguageState] = useState(initial?.language ?? readSavedLanguage)
  const [catalog, setCatalog] = useState(() =>
    initial?.messages ? { en, [initial.language]: initial.messages } : { en },
  )

  // Load the chosen language file if we don't have it yet.
  useEffect(() => {
    if (catalog[language]) return
    let cancelled = false
    loadLocale(language)
      .then((messages) => {
        if (!cancelled && messages) setCatalog((prev) => ({ ...prev, [language]: messages }))
      })
      .catch(() => {
        // Network failure: stay on English rather than showing a broken page.
        if (!cancelled) setLanguageState(DEFAULT_LANGUAGE)
      })
    return () => {
      cancelled = true
    }
  }, [language, catalog])

  // Keep <html lang> in sync for accessibility and correct font shaping.
  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === language)
    document.documentElement.lang = meta?.htmlLang ?? 'en'
  }, [language])

  const setLanguage = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return
    setLanguageState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // Storage unavailable (private mode etc.) — the choice just won't be remembered.
    }
  }, [])

  const t = useCallback(
    (key, vars) => {
      const active = catalog[language]
      const value = (active && lookup(active, key)) ?? lookup(en, key)
      if (typeof value !== 'string') return key
      return interpolate(value, vars)
    },
    [catalog, language],
  )

  const value = useMemo(
    () => ({ t, language, setLanguage, isLoading: !catalog[language] }),
    [t, language, setLanguage, catalog],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
