import { useState } from 'react'
import {
  Button,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Text,
  Title,
} from '@mantine/core'
import { useI18n } from '../../i18n/context.js'
import { defaultGamificationSettings } from '../../mocks/coupons.js'

export function GamificationSettings() {
  const { t } = useI18n()
  const [draft, setDraft] = useState(defaultGamificationSettings)
  const [saved, setSaved] = useState(false)

  const setField = (field) => (value) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <Paper withBorder radius="md" p="lg">
      <Title order={3}>{t('coupons.gamification.title')}</Title>
      <Text c="dimmed" size="sm" mt="xs">
        {t('coupons.gamification.subtitle')}
      </Text>

      <form onSubmit={handleSubmit}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} mt="lg">
          <NumberInput
            label={t('coupons.gamification.dailyLimit.label')}
            description={t('coupons.gamification.dailyLimit.description')}
            value={draft.dailyFeedbackLimit}
            onChange={setField('dailyFeedbackLimit')}
            min={0}
            required
          />
          <NumberInput
            label={t('coupons.gamification.chance.label')}
            description={t('coupons.gamification.chance.description')}
            value={draft.rewardChancePercent}
            onChange={setField('rewardChancePercent')}
            min={0}
            max={100}
            suffix="%"
            required
          />
          <NumberInput
            label={t('coupons.gamification.points.label')}
            description={t('coupons.gamification.points.description')}
            value={draft.rewardPoints}
            onChange={setField('rewardPoints')}
            min={0}
            required
          />
        </SimpleGrid>

        <Group justify="flex-end" mt="lg" align="center">
          {saved && (
            <Text size="sm" c="green">
              {t('coupons.gamification.saved')}
            </Text>
          )}
          <Button type="submit">{t('coupons.gamification.save')}</Button>
        </Group>
      </form>
    </Paper>
  )
}
