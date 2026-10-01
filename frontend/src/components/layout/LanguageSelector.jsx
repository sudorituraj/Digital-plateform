import { useId } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { LANGUAGES } from '../../i18n/languages'
import { cn } from '../../lib/cn'

/**
 * Always-visible language switch:  English | हिंदी | भोजपुरी | Hinglish
 * Built from native radio buttons so it works with keyboard (arrow keys) and screen readers.
 * `variant="stacked"` is used inside the mobile menu.
 */
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
