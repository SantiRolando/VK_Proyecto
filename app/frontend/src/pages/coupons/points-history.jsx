import { useState } from 'react'
import {
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Text,
  Title,
} from '@mantine/core'
import { LineChart } from '@mantine/charts'
import { useI18n } from '../../i18n/context.js'
import {
  defaultGamificationSettings,
  getPointsHistory,
} from '../../mocks/coupons.js'

const PERIOD_OPTIONS = [
  { value: 'day', labelKey: 'reports.period.day' },
  { value: 'week', labelKey: 'reports.period.week' },
  { value: 'month', labelKey: 'reports.period.month' },
  { value: '6months', labelKey: 'reports.period.6months' },
  { value: 'year', labelKey: 'reports.period.year' },
]

function toNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function PointsHistory() {
  const { t } = useI18n()
  const actual = defaultGamificationSettings

  const [period, setPeriod] = useState('month')
  const [chancePercent, setChancePercent] = useState(actual.rewardChancePercent)
  const [dailyLimit, setDailyLimit] = useState(actual.dailyFeedbackLimit)
  const [rewardPoints, setRewardPoints] = useState(actual.rewardPoints)

  const chanceValue = toNumber(chancePercent, actual.rewardChancePercent)
  const limitValue = toNumber(dailyLimit, actual.dailyFeedbackLimit)
  const rewardValue = toNumber(rewardPoints, actual.rewardPoints)

  const showChance = chanceValue !== actual.rewardChancePercent
  const showLimit = limitValue !== actual.dailyFeedbackLimit
  const showReward = rewardValue !== actual.rewardPoints

  const pointsLabel = t('coupons.history.points')
  const chanceLabel = t('coupons.history.predictedChance')
  const limitLabel = t('coupons.history.predictedLimit')
  const rewardLabel = t('coupons.history.predictedPoints')

  const periodOptions = PERIOD_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))

  const data = getPointsHistory(period, {
    chancePercent: chanceValue,
    dailyFeedbackLimit: limitValue,
    rewardPoints: rewardValue,
  }).map((item) => {
    const row = { label: item.label, [pointsLabel]: item.points }
    if (showChance) row[chanceLabel] = item.predictedChance
    if (showLimit) row[limitLabel] = item.predictedLimit
    if (showReward) row[rewardLabel] = item.predictedPoints
    return row
  })

  const series = [{ name: pointsLabel, color: 'orange.6' }]
  if (showChance) {
    series.push({
      name: chanceLabel,
      color: 'indigo.6',
      strokeDasharray: '5 5',
    })
  }
  if (showLimit) {
    series.push({
      name: limitLabel,
      color: 'teal.6',
      strokeDasharray: '5 5',
    })
  }
  if (showReward) {
    series.push({
      name: rewardLabel,
      color: 'grape.6',
      strokeDasharray: '5 5',
    })
  }

  return (
    <Paper withBorder radius="md" p="lg">
      <Title order={3}>{t('coupons.history.title')}</Title>
      <Text c="dimmed" size="sm" mt="xs">
        {t('coupons.history.subtitle')}
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mt="lg">
        <Select
          label={t('reports.period.label')}
          value={period}
          onChange={setPeriod}
          data={periodOptions}
        />
        <NumberInput
          label={t('coupons.history.predictionChance.label')}
          description={t('coupons.history.predictionChance.description')}
          value={chancePercent}
          onChange={setChancePercent}
          min={0}
          max={100}
          suffix="%"
        />
        <NumberInput
          label={t('coupons.history.predictionLimit.label')}
          description={t('coupons.history.predictionLimit.description')}
          value={dailyLimit}
          onChange={setDailyLimit}
          min={0}
        />
        <NumberInput
          label={t('coupons.history.predictionPoints.label')}
          description={t('coupons.history.predictionPoints.description')}
          value={rewardPoints}
          onChange={setRewardPoints}
          min={0}
        />
      </SimpleGrid>

      <div className="mt-6">
        <LineChart
          h={300}
          data={data}
          dataKey="label"
          series={series}
          curveType="linear"
          tickLine="y"
          gridAxis="x"
          withXAxis
          withYAxis
          withDots
          withLegend
        />
      </div>
    </Paper>
  )
}
