import { useContext } from 'react'
import { I18nContext } from './context'

/**
 * Access translations anywhere:
 *   const { t, language, setLanguage } = useI18n()
 *   t('nav.home')                     -> "Home"
 *   t('footer.copyright', { year })   -> fills {year}
 */
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
