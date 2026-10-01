import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { loadLocale, readSavedLanguage } from './i18n/loadLocale'
import './index.css'

// Load the visitor's saved language before the first render (no flash of English).
const language = readSavedLanguage()
const messages = language === 'en' ? null : await loadLocale(language).catch(() => null)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App i18n={messages ? { language, messages } : undefined} />
  </StrictMode>,
)
