import { FeatureSection } from '@features/landing/section.jsx'
import { SECTION_IDS } from '@features/landing/section-ids.js'
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
  return (
    <FeatureSection
      id={SECTION_IDS.benefits}
      titleKey="benefits.title"
      subtitleKey="benefits.subtitle"
      items={BENEFITS}
    />
  )
}
