import { FeatureSection } from '@features/landing/section.jsx'
import { SECTION_IDS } from '@features/landing/section-ids.js'
import { IconBell, IconChartLine, IconPackage } from '@tabler/icons-react'

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
  return (
    <FeatureSection
      id={SECTION_IDS.store}
      titleKey="store.title"
      subtitleKey="store.subtitle"
      items={STORE_FEATURES}
    />
  )
}
