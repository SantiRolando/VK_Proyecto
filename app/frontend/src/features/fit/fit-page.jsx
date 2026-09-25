import { Card, Container } from '@mantine/core'
import { useSearchParams } from 'react-router'
import { useI18n } from '../../i18n/context.js'
import { PageHeader } from '../../components/page-header.jsx'
import { slugToLine } from '../../constants/lines.js'
import { GenerationSource } from '../../constants/enums.js'
import { FitForm } from './fit-form.jsx'

// Origen de la consulta (FR-003): `?src=` explícito o, si la ruta trae línea
// preseleccionada (QR), `QR`; por defecto `Direct`.
function resolveSource(searchParams) {
  const src = searchParams.get('src')
  if (src === 'landing') return GenerationSource.Landing
  if (src === 'qr') return GenerationSource.QR
  if (searchParams.get('line') || searchParams.get('linea')) return GenerationSource.QR
  return GenerationSource.Direct
}

// Pantalla de medición (US1): acepta `/fit?line=endurance` (alias `linea=`,
// Q-10) y registra el origen de la consulta.
export function FitPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()

  const initialLine = slugToLine(searchParams.get('line') ?? searchParams.get('linea'))
  const source = resolveSource(searchParams)

  return (
    <Container size="md" py="xl">
      <PageHeader title={t('fit.title')} subtitle={t('fit.subtitle')} />
      <Card withBorder radius="md" padding="lg">
        <FitForm initialLine={initialLine} source={source} />
      </Card>
    </Container>
  )
}
