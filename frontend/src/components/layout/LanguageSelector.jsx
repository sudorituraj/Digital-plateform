import { useId } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { LANGUAGES } from '../../i18n/languages'
import { cn } from '../../lib/cn'
import { Icon } from '../ui/Icon'

/**
 * Always-visible language switch:  English | हिंदी | भोजपुरी | Hinglish
 * Built from native radio buttons so it works with keyboard (arrow keys) and screen readers.
 * `variant="stacked"` is used inside the mobile menu.
 */

/** Compact picker for the phone top bar, where four names don't fit next to "My Appointments". */
export function LanguagePicker({ className }) {
  const { t, language, setLanguage } = useI18n()
  return (
    <label className={cn('relative inline-flex min-h-8 items-center rounded-full bg-white/12 text-white ring-1 ring-white/25', className)}>
      <Icon name="globe" size={15} className="pointer-events-none absolute left-2.5" />
      <span className="sr-only">{t('common.chooseLanguage')}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="min-h-8 cursor-pointer appearance-none rounded-full bg-transparent pr-7 pl-7 text-[0.8rem] font-semibold text-white outline-none focus-visible:outline-3 focus-visible:outline-accent-400"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} lang={l.htmlLang} className="text-ink">
            {l.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={15} className="pointer-events-none absolute right-2" />
    </label>
  )
}

export function LanguageSelector({ variant = 'inline', tone = 'light', className }) {
  const { t, language, setLanguage } = useI18n()
  const name = useId()

  return (
    <div
      role="radiogroup"
      aria-label={t('common.chooseLanguage')}
      className={cn(
        variant === 'inline' ? 'flex items-center gap-0.5' : 'grid grid-cols-2 gap-2',
        className,
      )}
    >
      {LANGUAGES.map((lang) => {
        const active = lang.code === language
        return (
          <label
            key={lang.code}
            lang={lang.htmlLang}
            className={cn(
              'relative inline-flex cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-colors duration-150',
              'has-focus-visible:outline-3 has-focus-visible:outline-offset-1 has-focus-visible:outline-accent-400',
              variant === 'inline'
                ? 'min-h-9 rounded-full px-2.5 text-[0.85rem] max-[375px]:px-2 max-[375px]:text-[0.8rem] sm:px-3'
                : 'min-h-12 rounded-control border px-3 text-base',
              variant === 'inline' &&
                (tone === 'dark'
                  ? active
                    ? 'bg-white text-primary-900'
                    : 'text-primary-100 hover:bg-white/10'
                  : active
                    ? 'bg-primary-700 text-white'
                    : 'text-ink-muted hover:bg-primary-50 hover:text-primary-800'),
              variant === 'stacked' &&
                (active
                  ? 'border-primary-600 bg-primary-50 text-primary-800'
                  : 'border-line-strong bg-surface text-ink hover:border-primary-300'),
            )}
          >
            <input
              type="radio"
              name={name}
              value={lang.code}
              checked={active}
              onChange={() => setLanguage(lang.code)}
              className="sr-only"
            />
            {lang.label}
          </label>
        )
      })}
    </div>
  )
}
