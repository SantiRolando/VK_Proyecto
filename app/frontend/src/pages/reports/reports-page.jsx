import { useState } from 'react'
import { Container, Paper, Select, Text, Title } from '@mantine/core'
import { BarChart, LineChart } from '@mantine/charts'
import { useI18n } from '../../i18n/context.js'
import { getReportData, getSizeDistribution } from '../../mocks/reports.js'

const PERIOD_OPTIONS = [
  { value: 'day', labelKey: 'reports.period.day' },
  { value: 'week', labelKey: 'reports.period.week' },
  { value: 'month', labelKey: 'reports.period.month' },
  { value: '6months', labelKey: 'reports.period.6months' },
  { value: 'year', labelKey: 'reports.period.year' },
]

export function ReportsPage() {
  const { t } = useI18n()
  const [period, setPeriod] = useState('month')

  const generationsLabel = t('reports.series.generations')
  const feedbackLabel = t('reports.series.feedback')
  const pointsLabel = t('reports.series.points')
  const countLabel = t('reports.series.count')

  const periodOptions = PERIOD_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))

  const reportData = getReportData(period).map((item) => ({
    label: item.label,
    [generationsLabel]: item.generaciones,
    [feedbackLabel]: item.feedback,
    [pointsLabel]: item.puntos,
  }))

  const sizeData = getSizeDistribution().map((item) => ({
    size: item.size,
    [countLabel]: item.count,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="lg" py="xl">
        <Title order={1} c="black">
          {t('reports.title')}
        </Title>
        <Text c="gray.7" mt="xs">
          {t('reports.subtitle')}
        </Text>

        <Select
          label={t('reports.period.label')}
          value={period}
          onChange={setPeriod}
          data={periodOptions}
          maw={320}
          mt="lg"
        />

        <Paper withBorder p="lg" mt="lg" radius="md" bg="white">
          <Title order={3} c="black">
            {t('reports.activity.title')}
          </Title>
          <Text c="dimmed" size="sm" mt="xs">
            {t('reports.activity.subtitle')}
          </Text>
          <LineChart
            h={300}
            data={reportData}
            dataKey="label"
            series={[
              { name: generationsLabel, color: 'blue.6' },
              { name: feedbackLabel, color: 'teal.6' },
              { name: pointsLabel, color: 'orange.6' },
            ]}
            curveType="linear"
            tickLine="y"
            gridAxis="x"
            withXAxis
            withYAxis
            withDots
          />
        </Paper>

        <Paper withBorder p="lg" mt="lg" radius="md" bg="white">
          <Title order={3} c="black">
            {t('reports.sizes.title')}
          </Title>
          <Text c="dimmed" size="sm" mt="xs">
            {t('reports.sizes.subtitle')}
          </Text>
          <BarChart
            h={300}
            data={sizeData}
            dataKey="size"
            series={[{ name: countLabel, color: 'dark.5' }]}
            tickLine="y"
            gridAxis="x"
            withXAxis
            withYAxis
          />
        </Paper>
      </Container>
    </div>
  )
}
