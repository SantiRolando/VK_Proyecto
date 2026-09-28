import { Benefits } from '@pages/landing-page/benefits.jsx'
import { CtaSection } from '@pages/landing-page/cta-section.jsx'
import { Hero } from '@pages/landing-page/hero.jsx'
import { HowItWorks } from '@pages/landing-page/how-it-works.jsx'
import { SiteHeader } from '@pages/landing-page/site-header.jsx'
import { Store } from '@pages/landing-page/store.jsx'

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
