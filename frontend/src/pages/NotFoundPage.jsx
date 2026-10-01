import { Button, Container, StateMessage } from '../components/ui'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n/useI18n'

export default function NotFoundPage() {
  const { t } = useI18n()
  usePageTitle('notFound')
  return (
    <Container size="narrow" className="py-16 sm:py-24">
      <h1 className="sr-only">{t('notFound.title')}</h1>
      <StateMessage
        kind="empty"
        title={t('notFound.title')}
        body={t('notFound.body')}
        action={
          <Button to="/" icon="arrowLeft">
            {t('common.backHome')}
          </Button>
        }
      />
    </Container>
  )
}
