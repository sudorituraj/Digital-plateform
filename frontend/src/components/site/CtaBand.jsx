import { useI18n } from '../../i18n/useI18n'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { ContactActions } from './ContactActions'

/** Closing call-to-action shown near the bottom of public pages. */
export function CtaBand({ title, body }) {
  const { t } = useI18n()
  return (
    <section className="py-14 sm:py-20" aria-labelledby="cta-title">
      <Container>
        <Reveal className="relative overflow-hidden rounded-[1.75rem] bg-primary-800 px-6 py-10 text-white sm:px-12 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-primary-600/50 blur-2xl"
          />
          <div aria-hidden="true" className="pointer-events-none absolute top-8 right-10 size-3 rounded-full bg-accent-400" />
          <div className="relative max-w-2xl">
            <h2 id="cta-title" className="text-3xl text-white sm:text-4xl">
              {title ?? t('home.cta.title')}
            </h2>
            <p className="mt-3 text-lg text-primary-100">{body ?? t('home.cta.body')}</p>
            <ContactActions inverse className="mt-8" />
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
