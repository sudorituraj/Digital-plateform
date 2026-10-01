import { Reveal } from '../ui/Reveal'
import { AvatarIllustration } from '../ui/AvatarIllustration'
import { Icon } from '../ui/Icon'
import { cn } from '../../lib/cn'
import { useI18n } from '../../i18n/useI18n'

// Shown only when clinic.features.healthEducation is on (content needs the doctor's approval).
/**
 * Educational content preview cards for periods and pregnancy
 */
export function EducationPreview() {
  const { t } = useI18n()

  const topics = [
    {
      key: 'periods',
      title: t('education.periods.title'),
      description: t('education.periods.description'),
      avatar: 'teenGirl',
      icon: 'calendar',
      color: 'bg-gradient-to-br from-purple-100 to-pink-100',
      accentColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      category: t('education.periods.title'),
      items: [
        t('education.periods.normalCycle'),
        t('education.periods.normalDuration'),
        t('education.periods.tip1'),
        t('education.periods.tip2'),
      ],
      cta: t('common.learnMore'),
      href: '/education/periods',
    },
    {
      key: 'pregnancy',
      title: t('education.pregnancy.title'),
      description: t('education.pregnancy.description'),
      avatar: 'pregnantWoman',
      icon: 'heart',
      color: 'bg-gradient-to-br from-pink-100 to-orange-100',
      accentColor: 'text-pink-700',
      bgColor: 'bg-pink-50',
      category: t('education.pregnancy.title'),
      items: [
        t('education.pregnancy.firstTrimester'),
        t('education.pregnancy.secondTrimester'),
        t('education.pregnancy.thirdTrimester'),
        t('education.pregnancy.prenatalCare'),
      ],
      cta: t('common.learnMore'),
      href: '/education/pregnancy',
    },
  ]

  return (
    <section aria-labelledby="education-title" className="py-16 sm:py-24 bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal as="header" className="text-center max-w-2xl mx-auto mb-12">
          <h2 id="education-title" className="text-3xl sm:text-4xl font-display">
            {t('education.title')}
          </h2>
          <p className="mt-3 text-lg text-ink-muted">{t('education.subtitle')}</p>
        </Reveal>

        <Reveal as="div" className="grid gap-6 lg:grid-cols-2" delay={100}>
          {topics.map((topic, index) => (
            <Reveal
              key={topic.key}
              as="article"
              className={cn(
                'relative overflow-hidden rounded-2xl p-6 sm:p-8 lg:p-10',
                'border border-line bg-surface shadow-card',
                'hover:shadow-raised hover:border-primary-200',
                'transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                'hover:-translate-y-1'
              )}
              delay={index * 150}
            >
              {/* Background gradient accent */}
              <div
                aria-hidden="true"
                className={cn(
                  'absolute top-0 right-0 w-1/2 h-full opacity-50',
                  topic.color
                )}
              />

              <div className="relative flex flex-col h-full">
                {/* Avatar + Title */}
                <div className="flex items-start gap-4 mb-4">
                  <AvatarIllustration name={topic.avatar} size={72} />
                  <div className="flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mb-3" style={{ backgroundColor: topic.bgColor, color: topic.accentColor }}>
                      <Icon name={topic.icon} size={16} />
                      {topic.category}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-display text-ink pr-4">
                      {topic.title}
                    </h3>
                  </div>
                </div>

                <p className="text-ink-muted mb-6 flex-1">{topic.description}</p>

                {/* Key points */}
                <ul className="space-y-3 mb-6 flex-1">
                  {topic.items.map((item, i) => (
                    <Reveal key={i} as="li" delay={index * 150 + i * 80} className="flex items-start gap-3">
                      <span className="flex-shrink-0 mt-1 grid size-5 place-items-center rounded-full" style={{ backgroundColor: topic.accentColor }}>
                        <Icon name="check" size={12} className="text-white" />
                      </span>
                      <span className="text-sm text-ink-muted">{item}</span>
                    </Reveal>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={topic.href}
                  className={cn(
                    'inline-flex items-center gap-2 font-semibold',
                    'hover:gap-3 transition-all duration-300',
                    topic.accentColor
                  )}
                >
                  {topic.cta}
                  <Icon name="arrowRight" size={18} />
                </a>
              </div>
            </Reveal>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
