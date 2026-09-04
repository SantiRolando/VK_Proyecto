import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Collapse,
  Container,
  Paper,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useI18n } from '../../i18n/context.js'
import { SizingForm } from './sizing-form.jsx'
import { LockedSection } from './locked-section.jsx'
import { getRecommendedProducts, mockHistory } from '../../mocks/sizing.js'

const FIT_KEYS = {
  small: 'feedback.small',
  correct: 'feedback.fit',
  large: 'feedback.large',
}

function SizeExplanation({ result }) {
  const { t } = useI18n()

  const names = result.measurementsUsed.map((m) =>
    t(`generator.measure.${m}`),
  )

  const outOfRange = result.measurementsUsed
    .map((m) => ({ key: m, distance: result.distances[m] }))
    .filter((entry) => entry.distance > 0)

  return (
    <div className="flex flex-col gap-1">
      <Text size="sm" c="white">
        {result.confidence === 'exact'
          ? t('generator.explain.exact')
          : t('generator.explain.closest')}
      </Text>
      <Text size="xs" c="gray.4">
        {t('generator.explain.used')} {names.join(', ')}
      </Text>
      {outOfRange.map(({ key, distance }) => (
        <Text key={key} size="xs" c="gray.4">
          {t(`generator.measure.${key}`)}: {distance.toFixed(1)} cm{' '}
          {t('generator.explain.off')}
        </Text>
      ))}
    </div>
  )
}

function ResultCard({ result }) {
  const { t } = useI18n()

  return (
    <Paper withBorder p="lg" radius="md" bg="white">
      <Title order={3} c="black">
        {t('generator.result.title')}
      </Title>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Text fw={900} c="black" className="text-6xl">
          {result.size}
        </Text>
        <div className="flex flex-col gap-1">
          <Text c="dimmed" size="sm">
            USA {result.usa} · EU {result.eu}
          </Text>
          <Badge
            variant="light"
            color={result.confidence === 'exact' ? 'green' : 'orange'}
          >
            {result.confidence === 'exact'
              ? t('generator.result.exact')
              : t('generator.result.closest')}
          </Badge>
        </div>
      </div>

      <div className="mt-6">
        <Tooltip
          label={<SizeExplanation result={result} />}
          withArrow
          w={280}
          events={{ hover: true, focus: true, touch: true }}
        >
          <Button variant="light" size="sm">
            {t('generator.result.why')}
          </Button>
        </Tooltip>
      </div>
    </Paper>
  )
}

export function GeneratorPage() {
  const { t } = useI18n()
  const [result, setResult] = useState(null)

  const recommended = result ? getRecommendedProducts(result.size) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="md" py="xl">
        <Title order={1} c="black">
          {t('generator.title')}
        </Title>
        <Text c="gray.7" mt="xs">
          {t('generator.subtitle')}
        </Text>

        <Card withBorder radius="md" padding="lg" className="mt-8">
          <SizingForm onResult={setResult} />
        </Card>

        <Collapse expanded={Boolean(result)}>
          {result && (
            <>
              <div className="mt-8">
                <ResultCard result={result} />
              </div>

              <LockedSection title={t('feedback.title')}>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" color="dark">
                    {t('feedback.small')}
                  </Button>
                  <Button variant="outline" color="dark">
                    {t('feedback.fit')}
                  </Button>
                  <Button variant="outline" color="dark">
                    {t('feedback.large')}
                  </Button>
                </div>
              </LockedSection>

              <LockedSection title={t('products.title')}>
                {recommended.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {recommended.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>{product.name}</span>
                        <Badge variant="light" color="dark">
                          {product.size}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text c="gray.6">{t('products.empty')}</Text>
                )}
              </LockedSection>

              <LockedSection title={t('history.title')}>
                <div className="flex flex-col gap-2">
                  {mockHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span>{item.date}</span>
                      <span>{item.size}</span>
                      <span>{t(FIT_KEYS[item.fit])}</span>
                    </div>
                  ))}
                </div>
              </LockedSection>
            </>
          )}
        </Collapse>
      </Container>
    </div>
  )
}
