import { cn } from '../../lib/cn'
import { Container } from './Container'

/** Page section with an optional eyebrow/title/description heading block. */
export function Section({ eyebrow, title, description, align = 'left', tone = 'plain', id, className, children }) {
  const tones = { plain: '', surface: 'bg-surface', tinted: 'bg-primary-50/60' }
  const headingId = id ? `${id}-title` : undefined
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn('py-14 sm:py-20', tones[tone], className)}>
      <Container>
        {(eyebrow || title || description) && (
          <header className={cn('mb-8 max-w-2xl sm:mb-12', align === 'center' && 'mx-auto text-center')}>
            {eyebrow && (
              <p className="mb-2 text-sm font-semibold tracking-wide text-accent-700 uppercase">{eyebrow}</p>
            )}
            {title && (
              <h2 id={headingId} className="text-3xl sm:text-4xl">
                {title}
              </h2>
            )}
            {description && <p className="mt-3 text-lg text-ink-muted">{description}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  )
}
