import { telLink, whatsappLink } from '../../config/clinic'
import { useI18n } from '../../i18n/useI18n'
import { Button } from '../ui/Button'

/** Thumb-reach actions pinned to the bottom of phone screens: Call · WhatsApp · Book. */
export function MobileActionBar() {
  const { t } = useI18n()
  return (
    <nav
      aria-label={t('nav.quickActions')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden"
    >
      <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-2">
        <Button href={telLink()} variant="secondary" icon="phone" className="w-13 px-0" aria-label={t('common.callClinic')} />
        <Button
          href={whatsappLink(t('common.whatsappMessage'))}
          variant="whatsapp"
          icon="whatsapp"
          className="w-13 px-0"
          aria-label={t('common.whatsapp')}
        />
        <Button to="/book" icon="calendar" className="px-3" aria-label={t('common.bookAppointment')}>
          {t('common.bookShort')}
        </Button>
      </div>
    </nav>
  )
}
