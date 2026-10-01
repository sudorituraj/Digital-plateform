import { useEffect } from 'react'
import { useI18n } from '../i18n/useI18n'

/**
 * Sets the browser tab title (from meta.<key>) and the meta description (from metaDesc.<key>).
 * Pass `title` to override, e.g. for a service detail page.
 */
export function usePageTitle(metaKey, { title } = {}) {
  const { t } = useI18n()
  useEffect(() => {
    const brand = t('common.clinicShortName')
    const pageTitle = title ?? t(`meta.${metaKey}`)
    document.title = metaKey === 'home' ? t('meta.home') : `${pageTitle} | ${brand}`

    const descKey = `metaDesc.${metaKey}`
    const desc = t(descKey)
    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', desc !== descKey ? desc : t('metaDesc.home'))
  }, [metaKey, title, t])
}
