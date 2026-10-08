import { FeatureSection } from '@features/landing/section.jsx'
import { IconCheck, IconRuler, IconSwimming } from '@tabler/icons-react'

const STEPS = [
  { icon: IconRuler, titleKey: 'how.step1.title', bodyKey: 'how.step1.body' },
  { icon: IconSwimming, titleKey: 'how.step2.title', bodyKey: 'how.step2.body' },
  { icon: IconCheck, titleKey: 'how.step3.title', bodyKey: 'how.step3.body' },
]

export function HowItWorks() {
  return (
    <FeatureSection
      id="how"
      titleKey="how.title"
      subtitleKey="how.subtitle"
      items={STEPS}
    />
  )
}
