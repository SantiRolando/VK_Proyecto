import { Benefits } from '@features/landing/benefits.jsx'
import { CtaSection } from '@features/landing/cta-section.jsx'
import { Hero } from '@features/landing/hero.jsx'
import { HowItWorks } from '@features/landing/how-it-works.jsx'
import { SiteHeader } from '@features/landing/site-header.jsx'
import { Store } from '@features/landing/store.jsx'

export function LandingPage() {
  return (
    <div className="bg-white">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Store />
      <CtaSection />
    </div>
  )
}
