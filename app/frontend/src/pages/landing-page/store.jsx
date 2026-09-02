import { Text, Title } from '@mantine/core'
import { IconBell, IconChartLine, IconPackage } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { Section } from './section.jsx'

const STORE_FEATURES = [
  {
    icon: IconPackage,
    titleKey: 'store.inventory.title',
    bodyKey: 'store.inventory.body',
  },
  {
    icon: IconBell,
    titleKey: 'store.alerts.title',
    bodyKey: 'store.alerts.body',
  },
  {
    icon: IconChartLine,
    titleKey: 'store.data.title',
    bodyKey: 'store.data.body',
  },
]

export function Store() {
  const { t } = useI18n()

  return (
    <Section id="store" title={t('store.title')}>
      <Text c="gray.7" mt="sm">
        {t('store.subtitle')}
      </Text>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {STORE_FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.titleKey}
              className="rounded-lg border border-gray-200 p-6"
            >
              <Icon size={28} stroke={1.5} className="text-black" />
              <Title order={4} c="black" mt="md">
                {t(feature.titleKey)}
              </Title>
              <Text c="gray.6" mt="xs" size="sm">
                {t(feature.bodyKey)}
              </Text>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
