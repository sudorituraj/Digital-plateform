import { useI18n } from '../../i18n/useI18n'
import { cn } from '../../lib/cn'
import { NeedsConfirmation } from '../ui/NeedsConfirmation'

const SIZES = [480, 800, 1200, 1600]

/**
 * The clinic's front & signboard (from its public Justdial listing, cropped and colour-corrected —
 * nothing added or generated). Responsive WebP: phones download ~30 KB.
 * Marked for approval: ask the clinic for permission or original photos before going live (scope §19).
 */
export function ClinicPhoto({ priority = false, className, children }) {
  const { t } = useI18n()
  return (
    <figure className={cn('relative isolate overflow-hidden rounded-[1.75rem] bg-sunken shadow-raised', className)}>
      <img
        src="/images/clinic/clinic-front-800.webp"
        srcSet={SIZES.map((w) => `/images/clinic/clinic-front-${w}.webp ${w}w`).join(', ')}
        sizes="(min-width: 1024px) 560px, calc(100vw - 2rem)"
        width="1600"
        height="800"
        alt={t('home.photoAlt')}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        data-replace="Clinic front photo — from Justdial; get the clinic's approval or originals"
        className="aspect-[2/1] w-full animate-ken-burns object-cover"
      />
      {/* soft shade so text on the photo stays readable */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-primary-950/10 to-transparent" />
      <NeedsConfirmation className="absolute top-3 right-3 bg-white/90" />
      {children && <figcaption className="absolute inset-x-0 bottom-0 p-3 sm:p-4">{children}</figcaption>}
    </figure>
  )
}
