import { PageHeader } from '@components/page-header.jsx'
import { CommentsSection } from '@features/admin/analytics/comments-section.jsx'
import { MissingSizesSection } from '@features/admin/analytics/missing-sizes-section.jsx'
import { IndicatorsSection } from '@features/admin/dashboard/indicators-section.jsx'
import { useI18n } from '@i18n/context.js'
import { Container, Stack } from '@mantine/core'

/*
  Analíticas del panel: los indicadores del negocio, la demanda insatisfecha y los comentarios
  del feedback, cada uno como una sección propia de la misma pantalla.
*/
export function AnalyticsPage() {
  const { t } = useI18n()

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.analytics.title')}
        subtitle={t('admin.analytics.subtitle')}
      />

      <Stack gap="xl">
        <IndicatorsSection />
        <MissingSizesSection />
        <CommentsSection />
      </Stack>
    </Container>
  )
}
