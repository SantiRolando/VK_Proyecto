import { Section } from '@features/landing/section.jsx'
import { useI18n } from '@i18n/context.js'
import { Text, Title } from '@mantine/core'
import { IconShieldCheck, IconSwimming, IconTarget } from '@tabler/icons-react'

const BENEFITS = [
  {
    icon: IconTarget,
    titleKey: 'benefit.accurate.title',
    bodyKey: 'benefit.accurate.body',
  },
  {
    icon: IconShieldCheck,
    titleKey: 'benefit.noGuess.title',
    bodyKey: 'benefit.noGuess.body',
  },
  {
    icon: IconSwimming,
    titleKey: 'benefit.swim.title',
    bodyKey: 'benefit.swim.body',
  },
]

export function Benefits() {
  const { t } = useI18n()

  return (
    <Section id="benefits" title={t('benefits.title')} alt>
      <Text c="gray.7" mt="sm">
        {t('benefits.subtitle')}
      </Text>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon
          return (
            <div
              key={benefit.titleKey}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <Icon size={28} stroke={1.5} className="text-black" />
              <Title order={3} c="black" mt="md">
                {t(benefit.titleKey)}
              </Title>
              <Text c="gray.6" mt="xs" size="sm">
                {t(benefit.bodyKey)}
              </Text>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
