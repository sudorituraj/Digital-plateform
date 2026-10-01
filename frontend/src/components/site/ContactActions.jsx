import { telLink, whatsappLink } from '../../config/clinic'
import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'

/** The standard trio: Book · Call · WhatsApp. Used in hero, CTA band and page headers. */
export function ContactActions({ size = 'lg', inverse = false, showBook = true, bookTo = '/book', className }) {
  const { t } = useI18n()
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap', className)}>
      {showBook && (
        <Button to={bookTo} size={size} variant={inverse ? 'accent' : 'primary'} icon="calendar" iconRight="arrowRight">
          {t('common.bookAppointment')}
        </Button>
      )}
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Button href={telLink()} size={size} variant={inverse ? 'inverse' : 'secondary'} icon="phone">
          {t('common.call')}
        </Button>
        <Button href={whatsappLink(t('common.whatsappMessage'))} size={size} variant="whatsapp" icon="whatsapp">
          {t('common.whatsapp')}
        </Button>
      </div>
    </div>
  )
}
