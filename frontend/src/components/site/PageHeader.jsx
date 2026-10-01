import { Container } from '../ui/Container'

/** Top block of every inner page: small eyebrow, the page's single <h1>, and a short lead. */
export function PageHeader({ eyebrow, title, lead, children }) {
  return (
    <div className="relative overflow-hidden border-b border-line bg-primary-50/50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-accent-100/50 blur-3xl"
      />
      <Container className="relative py-10 sm:py-14">
        {eyebrow && (
          <p className="mb-2 animate-fade-up text-sm font-semibold tracking-wide text-accent-700 uppercase">{eyebrow}</p>
        )}
        <h1 className="max-w-3xl animate-fade-up text-3xl [animation-delay:60ms] sm:text-5xl">{title}</h1>
        {lead && (
          <p className="mt-4 max-w-2xl animate-fade-up text-lg text-ink-muted [animation-delay:120ms] sm:text-xl">
            {lead}
          </p>
        )}
        {children && <div className="mt-6 animate-fade-up [animation-delay:180ms]">{children}</div>}
      </Container>
    </div>
  )
}
