import { useI18n } from '@i18n/context.js'
import { Text, Title } from '@mantine/core'
import { Section } from '@pages/landing-page/section.jsx'
import { IconCheck, IconRuler, IconSwimming } from '@tabler/icons-react'

const STEPS = [
  { icon: IconRuler, titleKey: 'how.step1.title', bodyKey: 'how.step1.body' },
  {
    icon: IconSwimming,
    titleKey: 'how.step2.title',
    bodyKey: 'how.step2.body',
  },
  { icon: IconCheck, titleKey: 'how.step3.title', bodyKey: 'how.step3.body' },
]

export function HowItWorks() {
  const { t } = useI18n()

  return (
    <Section id="how" title={t('how.title')}>
      <Text c="gray.7" mt="sm">
        {t('how.subtitle')}
      </Text>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.titleKey} className="rounded-lg border border-gray-200 p-6">
              <Icon size={28} stroke={1.5} className="text-black" />
              <Title order={3} c="black" mt="md">
                {t(step.titleKey)}
              </Title>
              <Text c="gray.6" mt="xs" size="sm">
                {t(step.bodyKey)}
              </Text>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
