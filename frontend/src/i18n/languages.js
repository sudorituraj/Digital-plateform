/**
 * Supported UI languages.
 * `htmlLang` is written to <html lang> so screen readers and fonts behave correctly.
 * Hinglish is Hindi written in Latin script, hence "hi-Latn".
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'hi', label: 'हिंदी', htmlLang: 'hi' },
  { code: 'bho', label: 'भोजपुरी', htmlLang: 'bho' },
  { code: 'hinglish', label: 'Hinglish', htmlLang: 'hi-Latn' },
]

export const DEFAULT_LANGUAGE = 'en'
export const STORAGE_KEY = 'snh.language'
